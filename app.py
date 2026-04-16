from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from functools import wraps
import json, os, hashlib, io, zipfile, threading, time, re, shutil
import base64
from datetime import datetime
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

try:
    from dotenv import load_dotenv
except ModuleNotFoundError:
    def load_dotenv(*args, **kwargs):
        return False

from db import init_db, list_users, get_user, verify_user, save_sync_run, list_sync_runs
from ml_sync import sync_mercado_livre_data

try:
    import psycopg
except ModuleNotFoundError:
    psycopg = None

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'change-me-in-production')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', 'false').lower() == 'true'

APP_ROOT = os.path.dirname(__file__)
DEFAULT_DATA_DIR = os.path.join(APP_ROOT, 'data')
DATA_DIR = os.getenv('DATA_DIR', DEFAULT_DATA_DIR)
LOG_DIR  = os.path.join(DATA_DIR, 'logs')
DB_PATH = os.getenv('DB_PATH', os.path.join(DATA_DIR, 'app.db'))
DATABASE_URL = os.getenv('DATABASE_URL', '').strip()
USE_POSTGRES = bool(DATABASE_URL)
_MISSING = object()


def _disable_postgres(reason: str):
    global USE_POSTGRES
    USE_POSTGRES = False
    print(f'[warn] PostgreSQL desativado: {reason}. Usando armazenamento local.')

ML_ACCESS_TOKEN = os.getenv('ML_ACCESS_TOKEN', '').strip()
ML_SELLER_ID = os.getenv('ML_SELLER_ID', '').strip()
ML_CLIENT_ID = os.getenv('ML_CLIENT_ID', '').strip()
ML_CLIENT_SECRET = os.getenv('ML_CLIENT_SECRET', '').strip()
ML_REFRESH_TOKEN = os.getenv('ML_REFRESH_TOKEN', '').strip()
ML_AUTO_SYNC_MINUTES = int(os.getenv('ML_AUTO_SYNC_MINUTES', '0') or 0)

DEFAULT_USERS = {
    'admin': {'hash': hashlib.sha256(b'admin123').hexdigest(), 'role': 'admin'},
    'user1': {'hash': hashlib.sha256(b'user1123').hexdigest(), 'role': 'editor'},
    'user2': {'hash': hashlib.sha256(b'user2123').hexdigest(), 'role': 'editor'},
    'user3': {'hash': hashlib.sha256(b'user3123').hexdigest(), 'role': 'viewer'},
    'user4': {'hash': hashlib.sha256(b'user4123').hexdigest(), 'role': 'viewer'},
}

LOGIN_ATTEMPTS = {}
MAX_LOGIN_ATTEMPTS = 6
LOCK_SECONDS = 300


def bootstrap_data_dir():
    """If using external DATA_DIR, seed missing JSON files from bundled ./data."""
    if os.path.abspath(DATA_DIR) == os.path.abspath(DEFAULT_DATA_DIR):
        return

    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(LOG_DIR, exist_ok=True)

    for root, _, files in os.walk(DEFAULT_DATA_DIR):
        rel_root = os.path.relpath(root, DEFAULT_DATA_DIR)
        dest_root = DATA_DIR if rel_root == '.' else os.path.join(DATA_DIR, rel_root)
        os.makedirs(dest_root, exist_ok=True)
        for fname in files:
            if not fname.endswith('.json'):
                continue
            src = os.path.join(root, fname)
            dst = os.path.join(dest_root, fname)
            if not os.path.exists(dst):
                shutil.copy2(src, dst)


def _normalize_db_url(url: str) -> str:
    if url.startswith('postgres://'):
        url = 'postgresql://' + url[len('postgres://'):]
    parsed = urlsplit(url)
    q = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True) if k.lower() != 'pgbouncer']
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(q), parsed.fragment))


def _pg_connect():
    if not USE_POSTGRES:
        raise RuntimeError('DATABASE_URL não configurada')
    if psycopg is None:
        raise RuntimeError('psycopg não instalado. Execute pip install -r requirements.txt')
    return psycopg.connect(_normalize_db_url(DATABASE_URL))


def init_pg_kv_store():
    if not USE_POSTGRES:
        return
    try:
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS app_kv (
                        key TEXT PRIMARY KEY,
                        value JSONB NOT NULL,
                        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            conn.commit()
    except Exception as exc:
        _disable_postgres(str(exc))


def _pg_get_json(key: str, default=_MISSING):
    with _pg_connect() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT value FROM app_kv WHERE key=%s', (key,))
            row = cur.fetchone()
    if row is None:
        if default is _MISSING:
            raise KeyError(key)
        return default
    return row[0]


def _pg_set_json(key: str, data):
    with _pg_connect() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO app_kv (key, value, updated_at)
                VALUES (%s, %s::jsonb, NOW())
                ON CONFLICT (key)
                DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
                """,
                (key, json.dumps(data, ensure_ascii=False)),
            )
        conn.commit()


def _load_json_file(path, default=None):
    if not os.path.exists(path):
        return default if default is not None else []
    last_err = None
    # Tenta utf-8-sig primeiro para consumir BOM sem quebrar o parser JSON.
    for enc in ('utf-8-sig', 'utf-8', 'cp1252', 'latin-1'):
        try:
            with open(path, encoding=enc) as f:
                return json.load(f)
        except (UnicodeDecodeError, json.JSONDecodeError) as e:
            last_err = e
            continue
    raise ValueError(f'Nao foi possivel carregar JSON {path}: {last_err}')


def bootstrap_pg_store():
    if not USE_POSTGRES:
        return
    for root, _, files in os.walk(DEFAULT_DATA_DIR):
        rel_root = os.path.relpath(root, DEFAULT_DATA_DIR)
        for fname in files:
            if not fname.endswith('.json'):
                continue
            name = fname[:-5]
            key = name if rel_root == '.' else f"{rel_root.replace(os.sep, '/')}/{name}"
            current = _pg_get_json(key, default=_MISSING)
            if current is not _MISSING:
                continue
            src_path = os.path.join(root, fname)
            _pg_set_json(key, _load_json_file(src_path, default=[]))

def load(name, default=None):
    if USE_POSTGRES:
        return _pg_get_json(name, default if default is not None else [])
    path = os.path.join(DATA_DIR, f'{name}.json')
    return _load_json_file(path, default=default)

def save(name, data):
    if USE_POSTGRES:
        _pg_set_json(name, data)
        return
    path = os.path.join(DATA_DIR, f'{name}.json')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f: json.dump(data, f, ensure_ascii=False, indent=2)

def log_action(action, detail=''):
    logs = load('logs/historico', default=[])
    logs.append({'ts': datetime.now().strftime('%d/%m/%Y %H:%M:%S'), 'user': session.get('user','?'), 'action': action, 'detail': detail})
    save('logs/historico', logs[-500:])

def login_required(f):
    @wraps(f)
    def dec(*a, **kw):
        if 'user' not in session: return redirect(url_for('login'))
        return f(*a, **kw)
    return dec

def editor_required(f):
    @wraps(f)
    def dec(*a, **kw):
        if 'user' not in session: return redirect(url_for('login'))
        user = get_user(DB_PATH, session['user'])
        if (user or {}).get('role') not in ('admin','editor'):
            return jsonify({'ok':False,'error':'Sem permissão de edição'}), 403
        return f(*a, **kw)
    return dec

def admin_required(f):
    @wraps(f)
    def dec(*a, **kw):
        if 'user' not in session: return redirect(url_for('login'))
        user = get_user(DB_PATH, session['user'])
        if (user or {}).get('role') != 'admin':
            return jsonify({'ok':False,'error':'Acesso restrito ao admin'}), 403
        return f(*a, **kw)
    return dec


def _client_ip():
    forwarded = request.headers.get('X-Forwarded-For', '')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.remote_addr or 'unknown'


def _is_login_locked(ip: str):
    info = LOGIN_ATTEMPTS.get(ip)
    if not info:
        return False
    if info.get('count', 0) < MAX_LOGIN_ATTEMPTS:
        return False
    blocked_until = info.get('blocked_until', 0)
    return time.time() < blocked_until


def _register_login_failure(ip: str):
    info = LOGIN_ATTEMPTS.get(ip, {'count': 0, 'blocked_until': 0})
    info['count'] += 1
    if info['count'] >= MAX_LOGIN_ATTEMPTS:
        info['blocked_until'] = time.time() + LOCK_SECONDS
    LOGIN_ATTEMPTS[ip] = info


def _register_login_success(ip: str):
    LOGIN_ATTEMPTS.pop(ip, None)


def _require_json_object(payload, fields=None):
    if not isinstance(payload, dict):
        return False, 'Payload JSON inválido'
    if fields:
        for f in fields:
            if f not in payload:
                return False, f'Campo obrigatório ausente: {f}'
    return True, ''


def _validate_meses(payload):
    if not isinstance(payload, list):
        return False, 'Meses deve ser uma lista'
    for m in payload:
        if not isinstance(m, dict):
            return False, 'Mês inválido'
        key = str(m.get('key', ''))
        label = str(m.get('label', ''))
        if not re.match(r'^\d{4}-\d{2}$', key):
            return False, f'Formato de key inválido: {key}'
        if not label:
            return False, 'Label do mês obrigatório'
    return True, ''


def _validate_estoque(payload):
    if not isinstance(payload, list):
        return False, 'Estoque deve ser uma lista'
    for e in payload:
        if not isinstance(e, dict):
            return False, 'Item de estoque inválido'
        if not str(e.get('sku', '')).strip():
            return False, 'SKU é obrigatório em estoque'
    return True, ''


def _validate_extrato(payload):
    if not isinstance(payload, dict):
        return False, 'Extrato deve ser objeto por mês'
    for mes, data in payload.items():
        if not re.match(r'^\d{4}-\d{2}$', str(mes)):
            return False, f'Mês inválido no extrato: {mes}'
        if not isinstance(data, dict):
            return False, f'Extrato de {mes} inválido'
    return True, ''


def _nota_public(nota: dict):
    d = dict(nota or {})
    has_pdf = bool(d.get('pdf_b64'))
    d.pop('pdf_b64', None)
    d['has_pdf'] = has_pdf
    return d


def _find_nota(notas: list, nid: int):
    return next((n for n in notas if n.get('id') == nid), None)


def _build_skus_from_produtos():
    produtos = load('produtos', default=[])
    return [
        {'s': p.get('sku', ''), 'p': 0, 'u': int(p.get('v30') or 0), 'r': 0.0, 'l': 0.0}
        for p in produtos if p.get('sku')
    ]


def _run_ml_sync():
    result = sync_mercado_livre_data(
        DATA_DIR,
        ML_ACCESS_TOKEN,
        ML_SELLER_ID,
        client_id=ML_CLIENT_ID,
        client_secret=ML_CLIENT_SECRET,
        refresh_token=ML_REFRESH_TOKEN,
        token_loader=lambda: load('ml_tokens', default={}) or {},
        token_saver=lambda tokens: save('ml_tokens', tokens),
        dataset_saver=lambda dataset_name, payload: save(dataset_name, payload),
    )
    save_sync_run(DB_PATH, 'mercadolivre', 'success', json.dumps(result, ensure_ascii=False))
    return result


def _start_background_ml_sync():
    if ML_AUTO_SYNC_MINUTES <= 0:
        return

    def loop_sync():
        while True:
            try:
                _run_ml_sync()
            except Exception as exc:
                save_sync_run(DB_PATH, 'mercadolivre', 'error', str(exc))
            time.sleep(ML_AUTO_SYNC_MINUTES * 60)

    t = threading.Thread(target=loop_sync, daemon=True)
    t.start()

@app.route('/')
@login_required
def index():
    u = session['user']
    user = get_user(DB_PATH, u)
    return render_template('index.html', user=u, role=(user or {}).get('role','viewer'))

@app.route('/login', methods=['GET','POST'])
def login():
    error = None
    if request.method == 'POST':
        ip = _client_ip()
        if _is_login_locked(ip):
            error = 'Muitas tentativas. Aguarde alguns minutos.'
            return render_template('login.html', error=error)
        u = request.form.get('username','').strip()
        pwd = request.form.get('password','')
        user = verify_user(DB_PATH, u, pwd)
        if user:
            session['user'] = u
            _register_login_success(ip)
            log_action('login')
            return redirect(url_for('index'))
        _register_login_failure(ip)
        error = 'Usuário ou senha incorretos'
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    log_action('logout')
    session.clear()
    return redirect(url_for('login'))

# ── Financeiro (V, CMV, DEB_ML, ENC, EMP, DESP) ──────────────
@app.route('/api/financeiro', methods=['GET'])
@login_required
def get_fin(): return jsonify(load('financeiro', default={}))

@app.route('/api/financeiro', methods=['POST'])
@editor_required
def save_fin():
    ok, msg = _require_json_object(request.json, fields=['V'])
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 400
    save('financeiro', request.json)
    log_action('financeiro.save')
    return jsonify({'ok': True})

# ── Meses ─────────────────────────────────────────────────────
@app.route('/api/meses', methods=['GET'])
@login_required
def get_meses(): return jsonify(load('meses', default=[{'key':'2026-01','label':'Jan/2026'},{'key':'2026-02','label':'Fev/2026'},{'key':'2026-03','label':'Mar/2026'}]))

@app.route('/api/meses', methods=['POST'])
@editor_required
def save_meses():
    ok, msg = _validate_meses(request.json)
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 400
    save('meses', request.json)
    log_action('meses.save')
    return jsonify({'ok': True})

# ── Produtos ──────────────────────────────────────────────────
@app.route('/api/produtos', methods=['GET'])
@login_required
def get_produtos(): return jsonify(load('produtos'))

@app.route('/api/produtos', methods=['POST'])
@editor_required
def add_produto():
    ok, msg = _require_json_object(request.json, fields=['sku'])
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 400
    produtos = load('produtos')
    d = {**request.json, 'id': int(datetime.now().timestamp()*1000)}
    produtos.append(d)
    save('produtos', produtos)
    log_action('produto.add', d.get('sku',''))
    return jsonify({'ok': True, 'produto': d})

@app.route('/api/produtos/<int:pid>', methods=['PUT'])
@editor_required
def update_produto(pid):
    produtos = load('produtos')
    for i,p in enumerate(produtos):
        if p['id'] == pid:
            produtos[i] = {**p, **request.json, 'id': pid}
            save('produtos', produtos)
            log_action('produto.update', produtos[i].get('sku',''))
            return jsonify({'ok': True})
    return jsonify({'ok': False}), 404

@app.route('/api/produtos/<int:pid>', methods=['DELETE'])
@editor_required
def delete_produto(pid):
    produtos = load('produtos')
    rem = next((p for p in produtos if p['id']==pid), None)
    save('produtos', [p for p in produtos if p['id']!=pid])
    log_action('produto.delete', rem.get('sku','') if rem else str(pid))
    return jsonify({'ok': True})

# ── Notas ─────────────────────────────────────────────────────
@app.route('/api/notas', methods=['GET'])
@login_required
def get_notas():
    notas = load('notas', default=[])
    return jsonify([_nota_public(n) for n in notas])

@app.route('/api/notas', methods=['POST'])
@editor_required
def add_nota():
    ok, msg = _require_json_object(request.json, fields=['data', 'numero', 'fornecedor', 'valor'])
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 400

    data = str(request.json.get('data') or '').strip()
    numero = str(request.json.get('numero') or '').strip()
    fornecedor = str(request.json.get('fornecedor') or '').strip()
    try:
        valor = float(request.json.get('valor') or 0)
    except (TypeError, ValueError):
        valor = 0

    if not data:
        return jsonify({'ok': False, 'error': 'Data é obrigatória'}), 400
    if not numero:
        return jsonify({'ok': False, 'error': 'Número da NF é obrigatório'}), 400
    if not fornecedor:
        return jsonify({'ok': False, 'error': 'Fornecedor é obrigatório'}), 400
    if valor <= 0:
        return jsonify({'ok': False, 'error': 'Valor deve ser maior que zero'}), 400

    notas = load('notas')
    d = {**request.json, 'id': int(datetime.now().timestamp()*1000), 'data': data, 'numero': numero, 'fornecedor': fornecedor, 'valor': valor}
    notas.append(d)
    save('notas', notas)
    log_action('nota.add', f"NF {d.get('numero','')} {d.get('fornecedor','')}")
    return jsonify({'ok': True, 'nota': _nota_public(d)})


@app.route('/api/notas/upload', methods=['POST'])
@editor_required
def add_nota_with_pdf():
    data = (request.form.get('data') or '').strip()
    numero = (request.form.get('numero') or '').strip()
    fornecedor = (request.form.get('fornecedor') or '').strip()
    valor = float(request.form.get('valor') or 0)
    if not data:
        return jsonify({'ok': False, 'error': 'Data é obrigatória'}), 400
    if not numero:
        return jsonify({'ok': False, 'error': 'Número da NF é obrigatório'}), 400
    if not fornecedor:
        return jsonify({'ok': False, 'error': 'Fornecedor é obrigatório'}), 400
    if valor <= 0:
        return jsonify({'ok': False, 'error': 'Valor deve ser maior que zero'}), 400

    pdf_file = request.files.get('pdf')
    if not pdf_file:
        return jsonify({'ok': False, 'error': 'Arquivo PDF não enviado'}), 400

    filename = (pdf_file.filename or '').strip()
    if not filename.lower().endswith('.pdf'):
        return jsonify({'ok': False, 'error': 'Arquivo deve ser PDF (.pdf)'}), 400

    content = pdf_file.read()
    if not content:
        return jsonify({'ok': False, 'error': 'PDF vazio'}), 400
    if len(content) > 8 * 1024 * 1024:
        return jsonify({'ok': False, 'error': 'PDF excede 8MB'}), 400

    d = {
        'id': int(datetime.now().timestamp() * 1000),
        'data': data,
        'numero': numero,
        'fornecedor': fornecedor,
        'item': (request.form.get('item') or '').strip(),
        'cod_ncm': (request.form.get('cod_ncm') or '').strip(),
        'valor': valor,
        'valor_nf': float(request.form.get('valor_nf') or 0),
        'valor_sn': float(request.form.get('valor_sn') or 0),
        'tipo': (request.form.get('tipo') or 'cmv').strip() or 'cmv',
        'obs': (request.form.get('obs') or '').strip(),
        'pdf_name': filename,
        'pdf_b64': base64.b64encode(content).decode('ascii'),
    }

    notas = load('notas', default=[])
    notas.append(d)
    save('notas', notas)
    log_action('nota.add', f"NF {d.get('numero','')} {d.get('fornecedor','')} + PDF")
    return jsonify({'ok': True, 'nota': _nota_public(d)})


@app.route('/api/notas/<int:nid>/pdf', methods=['GET'])
@login_required
def get_nota_pdf(nid):
    notas = load('notas', default=[])
    nota = _find_nota(notas, nid)
    if not nota or not nota.get('pdf_b64'):
        return jsonify({'ok': False, 'error': 'PDF não encontrado para esta nota'}), 404
    try:
        content = base64.b64decode(nota['pdf_b64'])
    except Exception:
        return jsonify({'ok': False, 'error': 'PDF inválido'}), 400
    filename = nota.get('pdf_name') or f'nota_{nid}.pdf'
    return send_file(
        io.BytesIO(content),
        mimetype='application/pdf',
        as_attachment=False,
        download_name=filename,
    )

@app.route('/api/notas/<int:nid>', methods=['PUT'])
@editor_required
def update_nota(nid):
    ok, msg = _require_json_object(request.json)
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 400

    notas = load('notas', default=[])
    nota = _find_nota(notas, nid)
    if not nota:
        return jsonify({'ok': False, 'error': 'Nota não encontrada'}), 404

    payload = dict(request.json or {})
    for field in ('data', 'numero', 'fornecedor', 'item', 'cod_ncm', 'obs', 'tipo'):
        if field in payload:
            payload[field] = str(payload.get(field) or '').strip()

    for field in ('valor', 'valor_nf', 'valor_sn'):
        if field in payload:
            try:
                payload[field] = float(payload.get(field) or 0)
            except (TypeError, ValueError):
                return jsonify({'ok': False, 'error': f'Valor inválido em {field}'}), 400

    nota.update(payload)
    save('notas', notas)
    log_action('nota.update', f"NF {nota.get('numero','')} {nota.get('fornecedor','')}")
    return jsonify({'ok': True, 'nota': _nota_public(nota)})

@app.route('/api/notas/<int:nid>', methods=['DELETE'])
@editor_required
def delete_nota(nid):
    notas = load('notas')
    rem = _find_nota(notas, nid)
    save('notas', [n for n in notas if n['id']!=nid])
    log_action('nota.delete', f"NF {rem.get('numero','') if rem else nid}")
    return jsonify({'ok': True})

# ── Aportes ───────────────────────────────────────────────────
@app.route('/api/aportes', methods=['GET'])
@login_required
def get_aportes(): return jsonify(load('aportes', default=[]))

@app.route('/api/aportes', methods=['POST'])
@editor_required
def add_aporte():
    ok, msg = _require_json_object(request.json, fields=['socio', 'valor', 'tipo'])
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 400
    aportes = load('aportes', default=[])
    d = {**request.json, 'id': int(datetime.now().timestamp()*1000)}
    aportes.append(d)
    save('aportes', aportes)
    log_action('aporte.add', f"{d.get('socio','')} R$ {d.get('valor',0)}")
    return jsonify({'ok': True})

@app.route('/api/aportes/<int:aid>', methods=['DELETE'])
@editor_required
def delete_aporte(aid):
    aportes = load('aportes', default=[])
    save('aportes', [a for a in aportes if a['id']!=aid])
    log_action('aporte.delete', str(aid))
    return jsonify({'ok': True})

# ── Empréstimos ───────────────────────────────────────────────
@app.route('/api/emprestimos', methods=['GET'])
@login_required
def get_emp(): return jsonify(load('emprestimos', default=[]))

@app.route('/api/emprestimos', methods=['POST'])
@editor_required
def add_emp():
    ok, msg = _require_json_object(request.json, fields=['descricao', 'valor'])
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 400
    emps = load('emprestimos', default=[])
    d = {**request.json, 'id': int(datetime.now().timestamp()*1000)}
    emps.append(d)
    save('emprestimos', emps)
    log_action('emp.add', f"R$ {d.get('valor',0)}")
    return jsonify({'ok': True})

@app.route('/api/emprestimos/<int:eid>', methods=['DELETE'])
@editor_required
def delete_emp(eid):
    emps = load('emprestimos', default=[])
    save('emprestimos', [e for e in emps if e['id']!=eid])
    log_action('emp.delete', str(eid))
    return jsonify({'ok': True})

# ── Extrato ───────────────────────────────────────────────────
@app.route('/api/extrato', methods=['GET'])
@login_required
def get_extrato(): return jsonify(load('extrato', default={}))

@app.route('/api/extrato', methods=['POST'])
@editor_required
def save_extrato():
    ok, msg = _validate_extrato(request.json)
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 400
    save('extrato', request.json)
    log_action('extrato.save')
    return jsonify({'ok': True})

# ── Despesas ──────────────────────────────────────────────────
@app.route('/api/despesas', methods=['GET'])
@login_required
def get_desp(): return jsonify(load('despesas', default={}))

@app.route('/api/despesas', methods=['POST'])
@editor_required
def save_desp():
    save('despesas', request.json)
    log_action('despesas.save')
    return jsonify({'ok': True})

# ── Estoque ───────────────────────────────────────────────────
@app.route('/api/estoque', methods=['GET'])
@login_required
def get_est(): return jsonify(load('estoque', default=[]))

@app.route('/api/estoque', methods=['POST'])
@editor_required
def save_est():
    ok, msg = _validate_estoque(request.json)
    if not ok:
        return jsonify({'ok': False, 'error': msg}), 400
    save('estoque', request.json)
    log_action('estoque.save')
    return jsonify({'ok': True})

# ── SKUs ranking ──────────────────────────────────────────────
@app.route('/api/skus', methods=['GET'])
@login_required
def get_skus():
    skus = load('skus', default=[])
    if not skus:
        skus = _build_skus_from_produtos()
    return jsonify(skus)

@app.route('/api/skus', methods=['POST'])
@editor_required
def save_skus():
    save('skus', request.json)
    log_action('skus.save')
    return jsonify({'ok': True})

# ── Margem por SKU ────────────────────────────────────────────
@app.route('/api/marg', methods=['GET'])
@login_required
def get_marg(): return jsonify(load('marg', default=[]))

@app.route('/api/marg', methods=['POST'])
@editor_required
def save_marg():
    save('marg', request.json)
    log_action('marg.save')
    return jsonify({'ok': True})

# ── Histórico ─────────────────────────────────────────────────
@app.route('/api/historico', methods=['GET'])
@login_required
def get_hist(): return jsonify(list(reversed(load('logs/historico', default=[]))))

# ── Import Excel ──────────────────────────────────────────────
@app.route('/api/import/produtos', methods=['POST'])
@editor_required
def import_produtos():
    try:
        import pandas as pd
        f = request.files.get('file')
        df = pd.read_excel(io.BytesIO(f.read()))
        df.columns = [c.strip().lower() for c in df.columns]
        produtos = load('produtos')
        added = updated = 0
        for _, row in df.iterrows():
            nome = str(row.get('produto') or row.get('nome') or row.get('sku') or '').strip()
            custo = float(row.get('custo') or row.get('custo unit') or row.get('custo unitário') or 0)
            if not nome or nome=='nan': continue
            ex = next((p for p in produtos if p['sku'].lower()==nome.lower()), None)
            if not ex:
                produtos.append({'id': int(datetime.now().timestamp()*1000)+added, 'sku': nome, 'custo': custo, 'estoque': 0, 'v30': 0})
                added += 1
            else:
                ex['custo'] = custo
                updated += 1
        save('produtos', produtos)
        log_action('import.produtos', f'{added} add, {updated} upd')
        return jsonify({'ok': True, 'added': added, 'updated': updated})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 400


@app.route('/api/import/notas_item_ncm', methods=['POST'])
@editor_required
def import_notas_item_ncm():
    try:
        import pandas as pd
        import unicodedata

        f = request.files.get('file')
        if not f:
            return jsonify({'ok': False, 'error': 'Arquivo não enviado'}), 400

        df = pd.read_excel(io.BytesIO(f.read()))
        if df.empty:
            return jsonify({'ok': False, 'error': 'Planilha vazia'}), 400

        def _norm_col(name):
            raw = str(name or '').strip().lower()
            raw = unicodedata.normalize('NFKD', raw).encode('ascii', 'ignore').decode('ascii')
            return re.sub(r'[^a-z0-9]+', '', raw)

        normalized_cols = [(_norm_col(c), c) for c in df.columns]

        item_aliases = {
            'item', 'itens', 'produto', 'produtos', 'descricao',
            'descricaoproduto', 'descricaodoproduto', 'itemdescricao'
        }
        ncm_aliases = {
            'codncm', 'codigoncm', 'ncm', 'ncmsh', 'classificacaofiscal',
            'classfiscal', 'ncmfiscal'
        }
        date_aliases = {
            'data', 'date', 'dt', 'dtemissao', 'emissao', 'dataemissao',
            'datanota', 'datafiscal', 'datadocumento'
        }

        def _cell_text(v):
            if pd.isna(v):
                return ''
            txt = str(v).strip()
            return '' if txt.lower() == 'nan' else txt

        def _looks_like_date_text(txt: str) -> bool:
            if not txt:
                return False
            s = txt.strip()
            # 2026-04-16 / 2026-04-16 00:00:00
            if re.fullmatch(r'\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}(:\d{2})?)?', s):
                return True
            # 16/04/2026 / 16-04-2026
            if re.fullmatch(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}', s):
                return True
            return False

        def _ncm_digits(txt: str) -> str:
            return re.sub(r'\D+', '', txt or '')

        def _is_ncm_like(txt: str) -> bool:
            return bool(re.fullmatch(r'\d{6,10}', _ncm_digits(txt)))

        item_col = next((orig for nrm, orig in normalized_cols if nrm in item_aliases), None)
        ncm_col = next((orig for nrm, orig in normalized_cols if nrm in ncm_aliases), None)

        # Fallback por conteudo: evita usar coluna de data como ITEM.
        if (not item_col or not ncm_col) and len(df.columns) >= 2:
            sample = df.head(200)
            col_meta = []
            for nrm, orig in normalized_cols:
                vals = [_cell_text(v) for v in sample[orig].tolist()]
                non_empty = [v for v in vals if v]
                date_hits = sum(1 for v in non_empty if _looks_like_date_text(v))
                ncm_hits = sum(1 for v in non_empty if _is_ncm_like(v))
                text_hits = sum(1 for v in non_empty if any(ch.isalpha() for ch in v))
                col_meta.append({
                    'orig': orig,
                    'nrm': nrm,
                    'non_empty': len(non_empty),
                    'date_hits': date_hits,
                    'ncm_hits': ncm_hits,
                    'text_hits': text_hits,
                })

            if not ncm_col:
                cands = sorted(col_meta, key=lambda c: (c['ncm_hits'], c['non_empty']), reverse=True)
                if cands and cands[0]['ncm_hits'] > 0:
                    ncm_col = cands[0]['orig']

            if not item_col:
                item_cands = [
                    c for c in col_meta
                    if c['orig'] != ncm_col and c['nrm'] not in date_aliases and c['date_hits'] == 0
                ]
                item_cands = sorted(item_cands, key=lambda c: (c['text_hits'], c['non_empty']), reverse=True)
                if item_cands and item_cands[0]['text_hits'] > 0:
                    item_col = item_cands[0]['orig']

            # Ultimo fallback: duas primeiras nao-data.
            if not item_col or not ncm_col:
                non_date_cols = [orig for nrm, orig in normalized_cols if nrm not in date_aliases]
                if len(non_date_cols) >= 2:
                    item_col = item_col or non_date_cols[0]
                    ncm_col = ncm_col or non_date_cols[1]

        if not item_col or not ncm_col:
            encontrados = ', '.join([str(c) for c in df.columns])
            return jsonify({'ok': False, 'error': f'Não consegui identificar colunas de ITEM/NCM. Cabeçalhos encontrados: {encontrados}'}), 400

        replace_mode = str(request.form.get('replace') or '1').strip() not in ('0', 'false', 'False', 'no', 'NO')
        notas_existing = load('notas', default=[])
        previous_count = len(notas_existing) if isinstance(notas_existing, list) else 0
        notas = [] if replace_mode else (notas_existing if isinstance(notas_existing, list) else [])
        added = 0
        updated = 0
        total_rows = int(len(df.index))

        def _extract_item_and_ncm(row):
            item = _cell_text(row.get(item_col))
            cod_ncm = _cell_text(row.get(ncm_col))

            if _looks_like_date_text(item):
                item = ''

            # Fallback por linha: usa a primeira celula textual como item.
            if not item:
                for raw in row.tolist():
                    t = _cell_text(raw)
                    if not t:
                        continue
                    if _looks_like_date_text(t):
                        continue
                    if _is_ncm_like(t):
                        continue
                    item = t
                    break

            # Fallback por linha: tenta localizar um NCM numerico em qualquer coluna.
            if not cod_ncm:
                for raw in row.tolist():
                    t = _cell_text(raw)
                    if not t:
                        continue
                    digits = _ncm_digits(t)
                    if re.fullmatch(r'\d{6,10}', digits):
                        cod_ncm = digits
                        break

            # Mantem somente os digitos do NCM quando houver.
            if cod_ncm:
                digits = re.sub(r'\D+', '', cod_ncm)
                cod_ncm = digits or cod_ncm

            return item, cod_ncm

        for _, row in df.iterrows():
            item, cod_ncm = _extract_item_and_ncm(row)

            if not item and not cod_ncm:
                continue

            if not item:
                continue

            existing = next((n for n in notas if str(n.get('item') or '').strip().lower() == item.lower()), None)
            if existing:
                before = (str(existing.get('cod_ncm') or '').strip(), str(existing.get('item') or '').strip())
                existing['item'] = item
                existing['cod_ncm'] = cod_ncm
                if not str(existing.get('fornecedor') or '').strip():
                    existing['fornecedor'] = item
                after = (str(existing.get('cod_ncm') or '').strip(), str(existing.get('item') or '').strip())
                if before != after:
                    updated += 1
                continue

            notas.append({
                'id': int(datetime.now().timestamp() * 1000) + added,
                'data': '',
                'numero': '',
                'fornecedor': item,
                'item': item,
                'cod_ncm': cod_ncm,
                'valor': 0,
                'valor_nf': 0,
                'valor_sn': 0,
                'tipo': 'cmv',
                'obs': 'Importado de planilha ITEM/COD NCM',
            })
            added += 1

        if added == 0 and updated == 0:
            cols_txt = ', '.join([str(c) for c in df.columns])
            return jsonify({
                'ok': False,
                'error': f'Nenhuma linha válida encontrada para importar. Colunas detectadas: {cols_txt}',
                'total_rows': total_rows,
                'detected_columns': [str(c) for c in df.columns],
            }), 400

        save('notas', notas)
        mode_txt = 'replace' if replace_mode else 'merge'
        log_action('import.notas_item_ncm', f'{mode_txt} | prev={previous_count} | {added} add, {updated} upd')
        return jsonify({
            'ok': True,
            'added': added,
            'updated': updated,
            'total_rows': total_rows,
            'replaced': replace_mode,
            'previous_count': previous_count,
            'final_count': len(notas),
        })
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 400

@app.route('/api/import/skus', methods=['POST'])
@editor_required
def import_skus():
    try:
        import pandas as pd
        f = request.files.get('file')
        df = pd.read_excel(io.BytesIO(f.read()))
        df.columns = [c.strip().lower() for c in df.columns]
        skus = []
        for _, row in df.iterrows():
            s = str(row.get('produto') or row.get('sku') or row.get('nome') or '').strip()
            if not s or s=='nan': continue
            skus.append({'s': s, 'p': int(row.get('pedidos') or 0), 'u': int(row.get('unidades') or 0), 'r': float(row.get('receita') or 0), 'l': float(row.get('liquido') or row.get('líquido') or 0)})
        save('skus', skus)
        log_action('import.skus', f'{len(skus)} SKUs')
        return jsonify({'ok': True, 'count': len(skus)})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 400

@app.route('/api/import/marg', methods=['POST'])
@editor_required
def import_marg():
    try:
        import pandas as pd
        f = request.files.get('file')
        df = pd.read_excel(io.BytesIO(f.read()))
        df.columns = [c.strip().lower() for c in df.columns]
        marg = []
        for _, row in df.iterrows():
            sku = str(row.get('sku') or row.get('produto') or '').strip()
            if not sku or sku=='nan': continue
            marg.append({'sku': sku, 'custo': float(row.get('custo') or 0), 'un_est': int(row.get('estoque') or 0), 'v30': int(row.get('v30') or row.get('vendas 30d') or 0), 'custo_est': float(row.get('custo estoque') or 0)})
        save('marg', marg)
        log_action('import.marg', f'{len(marg)} SKUs')
        return jsonify({'ok': True, 'count': len(marg)})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 400

# ── Backup ────────────────────────────────────────────────────
@app.route('/api/backup', methods=['GET'])
@admin_required
def backup():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk(DATA_DIR):
            for fname in files:
                fpath = os.path.join(root, fname)
                z.write(fpath, os.path.relpath(fpath, DATA_DIR))
    buf.seek(0)
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_action('backup', f'backup_{ts}.zip')
    return send_file(buf, mimetype='application/zip', as_attachment=True, download_name=f'backup_{ts}.zip')

# ── Usuários ──────────────────────────────────────────────────
@app.route('/api/usuarios', methods=['GET'])
@admin_required
def get_usuarios(): return jsonify(list_users(DB_PATH))


# ── Sync Mercado Livre ────────────────────────────────────────
@app.route('/api/sync/ml', methods=['POST'])
@admin_required
def sync_ml_now():
    try:
        result = _run_ml_sync()
        log_action('sync.ml', f"orders={result.get('orders',0)} vendas={result.get('vendas',0)}")
        return jsonify({'ok': True, 'result': result})
    except Exception as exc:
        save_sync_run(DB_PATH, 'mercadolivre', 'error', str(exc))
        return jsonify({'ok': False, 'error': str(exc)}), 400


@app.route('/api/sync/ml/status', methods=['GET'])
@admin_required
def sync_ml_status():
    return jsonify({'ok': True, 'runs': list_sync_runs(DB_PATH)})

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)
bootstrap_data_dir()
init_pg_kv_store()
bootstrap_pg_store()
init_db(DB_PATH, DEFAULT_USERS)

if __name__ == '__main__':
    if os.getenv('WERKZEUG_RUN_MAIN') == 'true' or os.getenv('FLASK_DEBUG', 'false').lower() != 'true':
        _start_background_ml_sync()
    app.run(
        debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true',
        host='0.0.0.0',
        port=int(os.getenv('PORT', '5000')),
    )
