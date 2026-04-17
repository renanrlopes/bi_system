from flask import render_template, request, jsonify, session, redirect, url_for
from functools import wraps
import time


def init_auth(app, db_path, get_user, verify_user, log_action):
    login_attempts = {}
    max_login_attempts = 6
    lock_seconds = 300

    def login_required(f):
        @wraps(f)
        def dec(*a, **kw):
            if 'user' not in session:
                return redirect(url_for('login'))
            return f(*a, **kw)

        return dec

    def editor_required(f):
        @wraps(f)
        def dec(*a, **kw):
            if 'user' not in session:
                return redirect(url_for('login'))
            user = get_user(db_path, session['user'])
            if (user or {}).get('role') not in ('admin', 'editor'):
                return jsonify({'ok': False, 'error': 'Sem permissão de edição'}), 403
            return f(*a, **kw)

        return dec

    def admin_required(f):
        @wraps(f)
        def dec(*a, **kw):
            if 'user' not in session:
                return redirect(url_for('login'))
            user = get_user(db_path, session['user'])
            if (user or {}).get('role') != 'admin':
                return jsonify({'ok': False, 'error': 'Acesso restrito ao admin'}), 403
            return f(*a, **kw)

        return dec

    def _client_ip():
        forwarded = request.headers.get('X-Forwarded-For', '')
        if forwarded:
            return forwarded.split(',')[0].strip()
        return request.remote_addr or 'unknown'

    def _is_login_locked(ip: str):
        info = login_attempts.get(ip)
        if not info:
            return False
        if info.get('count', 0) < max_login_attempts:
            return False
        blocked_until = info.get('blocked_until', 0)
        return time.time() < blocked_until

    def _register_login_failure(ip: str):
        info = login_attempts.get(ip, {'count': 0, 'blocked_until': 0})
        info['count'] += 1
        if info['count'] >= max_login_attempts:
            info['blocked_until'] = time.time() + lock_seconds
        login_attempts[ip] = info

    def _register_login_success(ip: str):
        login_attempts.pop(ip, None)

    @app.route('/')
    @login_required
    def index():
        u = session['user']
        user = get_user(db_path, u)
        return render_template('index.html', user=u, role=(user or {}).get('role', 'viewer'))

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        error = None
        if request.method == 'POST':
            ip = _client_ip()
            if _is_login_locked(ip):
                error = 'Muitas tentativas. Aguarde alguns minutos.'
                return render_template('login.html', error=error)
            u = request.form.get('username', '').strip()
            pwd = request.form.get('password', '')
            user = verify_user(db_path, u, pwd)
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

    return login_required, editor_required, admin_required
