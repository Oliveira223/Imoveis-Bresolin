from datetime import datetime
from typing import Any
from flask import jsonify


def serialize_dates(data_list: list) -> list:
    """Converte objetos datetime para string ISO em listas de dicts."""
    for item in data_list:
        for key, value in item.items():
            if isinstance(value, datetime):
                item[key] = value.strftime('%Y-%m-%d %H:%M:%S')
    return data_list


def api_error(message: str, code: int = 400):
    return jsonify({'erro': message}), code


def api_success(data: dict | None = None, code: int = 200):
    response: dict[str, Any] = {'sucesso': True}
    if data:
        response.update(data)
    return jsonify(response), code
