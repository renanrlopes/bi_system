import json
import os
from collections import defaultdict
from datetime import datetime

import requests


ML_API_BASE = "https://api.mercadolibre.com"


def _token_cache_path(data_dir: str) -> str:
    return os.path.join(data_dir, "ml_tokens.json")


def _save_json(path: str, data) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _load_json(path: str, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _refresh_access_token(client_id: str, client_secret: str, refresh_token: str) -> dict:
    r = requests.post(
        f"{ML_API_BASE}/oauth/token",
        data={
            "grant_type": "refresh_token",
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
        },
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def _get(url: str, token: str, params: dict | None = None) -> dict:
    r = requests.get(url, params=params, headers={"Authorization": f"Bearer {token}"}, timeout=30)
    r.raise_for_status()
    return r.json()


def sync_mercado_livre_data(
    data_dir: str,
    access_token: str,
    seller_id: str,
    limit: int = 50,
    client_id: str = "",
    client_secret: str = "",
    refresh_token: str = "",
) -> dict:
    if not access_token or not seller_id:
        raise ValueError("Configure ML_ACCESS_TOKEN e ML_SELLER_ID")

    token_cache = _load_json(_token_cache_path(data_dir), default={})
    current_access = token_cache.get("access_token") or access_token
    current_refresh = token_cache.get("refresh_token") or refresh_token

    def guarded_get(url: str, params: dict | None = None):
        nonlocal current_access, current_refresh
        try:
            return _get(url, current_access, params=params)
        except requests.HTTPError as exc:
            code = exc.response.status_code if exc.response is not None else None
            if code != 401 or not (client_id and client_secret and current_refresh):
                raise
            token_payload = _refresh_access_token(client_id, client_secret, current_refresh)
            current_access = token_payload.get("access_token", current_access)
            current_refresh = token_payload.get("refresh_token", current_refresh)
            _save_json(
                _token_cache_path(data_dir),
                {
                    "access_token": current_access,
                    "refresh_token": current_refresh,
                    "updated_at": datetime.utcnow().isoformat(),
                },
            )
            return _get(url, current_access, params=params)

    offset = 0
    order_ids: list[int] = []

    while True:
        payload = guarded_get(
            f"{ML_API_BASE}/orders/search",
            params={
                "seller": seller_id,
                "order.status": "paid",
                "sort": "date_desc",
                "limit": limit,
                "offset": offset,
            },
        )
        ids = payload.get("results", [])
        if not ids:
            break
        order_ids.extend(ids)
        paging = payload.get("paging", {})
        total = int(paging.get("total", 0))
        offset += limit
        if offset >= total:
            break

    vendas = []
    agg = defaultdict(lambda: {"p": 0, "u": 0, "r": 0.0, "l": 0.0})

    for oid in order_ids:
        detail = guarded_get(f"{ML_API_BASE}/orders/{oid}")
        paid_amount = float(detail.get("paid_amount") or detail.get("total_amount") or 0)
        order_date = detail.get("date_closed") or detail.get("date_created") or ""

        # Valor liquido aproximado: pago - custos identificados em payments (se disponivel)
        fees = 0.0
        for p in detail.get("payments", []):
            fees += float(p.get("marketplace_fee") or 0)
            fees += float(p.get("coupon_amount") or 0)
            fees += float(p.get("taxes_amount") or 0)
        net_order = paid_amount - fees

        items = detail.get("order_items", [])
        if not items:
            continue

        # Distribui proporcionalmente o liquido por item
        gross_sum = sum(float((it.get("full_unit_price") or it.get("unit_price") or 0)) * int(it.get("quantity") or 0) for it in items) or 1.0

        for it in items:
            item = it.get("item", {})
            title = (item.get("title") or "").strip() or "Sem titulo"
            qty = int(it.get("quantity") or 0)
            unit = float(it.get("full_unit_price") or it.get("unit_price") or 0)
            gross = unit * qty
            net = net_order * (gross / gross_sum)
            sku = title

            vendas.append(
                {
                    "order_id": oid,
                    "date": order_date,
                    "sku": sku,
                    "produto": title,
                    "quantidade": qty,
                    "receita_bruta": round(gross, 2),
                    "liquido_ml": round(net, 2),
                }
            )

            agg[sku]["p"] += 1
            agg[sku]["u"] += qty
            agg[sku]["r"] += gross
            agg[sku]["l"] += net

    skus = [
        {"s": sku, "p": v["p"], "u": v["u"], "r": round(v["r"], 2), "l": round(v["l"], 2)}
        for sku, v in sorted(agg.items(), key=lambda kv: kv[1]["r"], reverse=True)
    ]

    _save_json(os.path.join(data_dir, "vendas.json"), vendas)
    _save_json(os.path.join(data_dir, "skus.json"), skus)

    return {
        "orders": len(order_ids),
        "vendas": len(vendas),
        "skus": len(skus),
        "token_cached": bool(current_access),
        "synced_at": datetime.utcnow().isoformat(),
    }
