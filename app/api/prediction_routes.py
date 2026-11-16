from flask import Blueprint, jsonify, request
from sqlalchemy import select
from werkzeug.exceptions import NotFound
from app.extensions import session
from app.models import Prediction
from app.repositories.students import get_student
from app.services.prediction_service import predict, serialize_result

bp = Blueprint('predictions', __name__)

@bp.post('/predictions')
def create_prediction():
    return jsonify(predict(request.get_json())), 201

@bp.get('/predictions/<int:student_id>')
def latest_prediction(student_id):
    get_student(student_id)
    row = session().scalar(select(Prediction).where(Prediction.student_id == student_id).order_by(Prediction.created_at.desc(), Prediction.id.desc()).limit(1))
    if row is None:
        raise NotFound('El estudiante aún no tiene predicciones')
    return jsonify(serialize_result(row))
