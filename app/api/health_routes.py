from flask import Blueprint, jsonify
from sqlalchemy import text
from app.extensions import session

bp = Blueprint('health', __name__)

@bp.get('/health')
def health():
    session().execute(text('SELECT 1'))
    return jsonify(status='UP', database='UP', prediction_mode='EXPERIMENTAL')
