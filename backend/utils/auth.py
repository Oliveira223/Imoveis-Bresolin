import os
from functools import wraps
from typing import Optional, Callable
from flask import request, Response


def check_auth(username: str, password: str) -> bool:
    admin_user = os.getenv('ADMIN_USERNAME', 'admin')
    admin_pass = os.getenv('ADMIN_PASSWORD', 'change_this_password')
    return username == admin_user and password == admin_pass


def authenticate() -> Response:
    return Response(
        'Acesso restrito.\n', 401,
        {'WWW-Authenticate': 'Basic realm="Painel Admin"'}
    )


def verify_admin() -> Optional[Response]:
    auth = request.authorization
    if not auth or not check_auth(auth.username, auth.password):
        return authenticate()
    return None


def make_requires_auth(limiter) -> Callable:
    """Retorna o decorator requires_auth já associado ao limiter da aplicação."""
    def requires_auth(f: Callable) -> Callable:
        @limiter.limit("10 per minute")
        @wraps(f)
        def decorated(*args, **kwargs):
            auth = request.authorization
            if not auth or not check_auth(auth.username, auth.password):
                return authenticate()
            return f(*args, **kwargs)
        return decorated
    return requires_auth
