from datetime import datetime

from flask import jsonify, request


def init_produto_routes(
    app,
    load,
    save,
    log_action,
    login_required,
    editor_required,
    require_json_object,
):
    @app.route('/api/produtos', methods=['GET'])
    @login_required
    def get_produtos():
        return jsonify(load('produtos'))

    @app.route('/api/produtos', methods=['POST'])
    @editor_required
    def add_produto():
        ok, msg = require_json_object(request.json, fields=['sku'])
        if not ok:
            return jsonify({'ok': False, 'error': msg}), 400
        produtos = load('produtos')
        novo = {**request.json, 'id': int(datetime.now().timestamp() * 1000)}
        produtos.append(novo)
        save('produtos', produtos)
        log_action('produto.add', novo.get('sku', ''))
        return jsonify({'ok': True, 'produto': novo})

    @app.route('/api/produtos/<int:pid>', methods=['PUT'])
    @editor_required
    def update_produto(pid):
        produtos = load('produtos')
        for idx, produto in enumerate(produtos):
            if produto['id'] == pid:
                produtos[idx] = {**produto, **request.json, 'id': pid}
                save('produtos', produtos)
                log_action('produto.update', produtos[idx].get('sku', ''))
                return jsonify({'ok': True})
        return jsonify({'ok': False}), 404

    @app.route('/api/produtos/<int:pid>', methods=['DELETE'])
    @editor_required
    def delete_produto(pid):
        produtos = load('produtos')
        removido = next((p for p in produtos if p['id'] == pid), None)
        save('produtos', [p for p in produtos if p['id'] != pid])
        log_action('produto.delete', removido.get('sku', '') if removido else str(pid))
        return jsonify({'ok': True})
