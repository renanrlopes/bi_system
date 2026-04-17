from flask import jsonify, request


def init_data_routes(
    app,
    load,
    save,
    log_action,
    login_required,
    editor_required,
    require_json_object,
    validate_meses,
    validate_extrato,
    validate_estoque,
    build_skus_from_produtos,
):
    # Financeiro (V, CMV, DEB_ML, ENC, EMP, DESP)
    @app.route('/api/financeiro', methods=['GET'])
    @login_required
    def data_get_financeiro():
        return jsonify(load('financeiro', default={}))

    @app.route('/api/financeiro', methods=['POST'])
    @editor_required
    def data_save_financeiro():
        payload = request.json
        ok, msg = require_json_object(payload, fields=['V'])
        if not ok:
            return jsonify({'ok': False, 'error': msg}), 400
        save('financeiro', payload)
        log_action('financeiro.save')
        return jsonify({'ok': True})

    # Meses
    @app.route('/api/meses', methods=['GET'])
    @login_required
    def data_get_meses():
        return jsonify(
            load(
                'meses',
                default=[
                    {'key': '2026-01', 'label': 'Jan/2026'},
                    {'key': '2026-02', 'label': 'Fev/2026'},
                    {'key': '2026-03', 'label': 'Mar/2026'},
                ],
            )
        )

    @app.route('/api/meses', methods=['POST'])
    @editor_required
    def data_save_meses():
        payload = request.json
        ok, msg = validate_meses(payload)
        if not ok:
            return jsonify({'ok': False, 'error': msg}), 400
        save('meses', payload)
        log_action('meses.save')
        return jsonify({'ok': True})

    # Extrato
    @app.route('/api/extrato', methods=['GET'])
    @login_required
    def data_get_extrato():
        return jsonify(load('extrato', default={}))

    @app.route('/api/extrato', methods=['POST'])
    @editor_required
    def data_save_extrato():
        payload = request.json
        ok, msg = validate_extrato(payload)
        if not ok:
            return jsonify({'ok': False, 'error': msg}), 400
        save('extrato', payload)
        log_action('extrato.save')
        return jsonify({'ok': True})

    # Despesas
    @app.route('/api/despesas', methods=['GET'])
    @login_required
    def data_get_despesas():
        return jsonify(load('despesas', default={}))

    @app.route('/api/despesas', methods=['POST'])
    @editor_required
    def data_save_despesas():
        save('despesas', request.json)
        log_action('despesas.save')
        return jsonify({'ok': True})

    # Estoque
    @app.route('/api/estoque', methods=['GET'])
    @login_required
    def data_get_estoque():
        return jsonify(load('estoque', default=[]))

    @app.route('/api/estoque', methods=['POST'])
    @editor_required
    def data_save_estoque():
        payload = request.json
        ok, msg = validate_estoque(payload)
        if not ok:
            return jsonify({'ok': False, 'error': msg}), 400
        save('estoque', payload)
        log_action('estoque.save')
        return jsonify({'ok': True})

    # SKUs ranking
    @app.route('/api/skus', methods=['GET'])
    @login_required
    def data_get_skus():
        skus = load('skus', default=[])
        if not skus:
            skus = build_skus_from_produtos()
        return jsonify(skus)

    @app.route('/api/skus', methods=['POST'])
    @editor_required
    def data_save_skus():
        save('skus', request.json)
        log_action('skus.save')
        return jsonify({'ok': True})

    # Margem por SKU
    @app.route('/api/marg', methods=['GET'])
    @login_required
    def data_get_marg():
        return jsonify(load('marg', default=[]))

    @app.route('/api/marg', methods=['POST'])
    @editor_required
    def data_save_marg():
        save('marg', request.json)
        log_action('marg.save')
        return jsonify({'ok': True})

    # Historico
    @app.route('/api/historico', methods=['GET'])
    @login_required
    def data_get_historico():
        return jsonify(list(reversed(load('logs/historico', default=[]))))

