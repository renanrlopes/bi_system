from datetime import datetime

from flask import jsonify, request


def init_capital_routes(
    app,
    load,
    save,
    log_action,
    login_required,
    editor_required,
    require_json_object,
):
    # Aportes
    @app.route('/api/aportes', methods=['GET'])
    @login_required
    def get_aportes():
        return jsonify(load('aportes', default=[]))

    @app.route('/api/aportes', methods=['POST'])
    @editor_required
    def add_aporte():
        ok, msg = require_json_object(request.json, fields=['socio', 'valor', 'tipo'])
        if not ok:
            return jsonify({'ok': False, 'error': msg}), 400
        aportes = load('aportes', default=[])
        registro = {**request.json, 'id': int(datetime.now().timestamp() * 1000)}
        aportes.append(registro)
        save('aportes', aportes)
        log_action('aporte.add', f"{registro.get('socio', '')} R$ {registro.get('valor', 0)}")
        return jsonify({'ok': True})

    @app.route('/api/aportes/<int:aid>', methods=['DELETE'])
    @editor_required
    def delete_aporte(aid):
        aportes = load('aportes', default=[])
        save('aportes', [a for a in aportes if a['id'] != aid])
        log_action('aporte.delete', str(aid))
        return jsonify({'ok': True})

    # Emprestimos
    @app.route('/api/emprestimos', methods=['GET'])
    @login_required
    def get_emp():
        return jsonify(load('emprestimos', default=[]))

    @app.route('/api/emprestimos', methods=['POST'])
    @editor_required
    def add_emp():
        ok, msg = require_json_object(request.json, fields=['descricao', 'valor'])
        if not ok:
            return jsonify({'ok': False, 'error': msg}), 400
        emprestimos = load('emprestimos', default=[])
        registro = {**request.json, 'id': int(datetime.now().timestamp() * 1000)}
        emprestimos.append(registro)
        save('emprestimos', emprestimos)
        log_action('emp.add', f"R$ {registro.get('valor', 0)}")
        return jsonify({'ok': True})

    @app.route('/api/emprestimos/<int:eid>', methods=['DELETE'])
    @editor_required
    def delete_emp(eid):
        emprestimos = load('emprestimos', default=[])
        save('emprestimos', [e for e in emprestimos if e['id'] != eid])
        log_action('emp.delete', str(eid))
        return jsonify({'ok': True})
