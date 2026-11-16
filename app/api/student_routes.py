from flask import Blueprint, jsonify, request
from sqlalchemy import select, func
from werkzeug.exceptions import BadRequest
from app.extensions import session
from app.models import Student
from app.repositories.students import get_student, serialize

bp = Blueprint('students', __name__)

@bp.get('/students')
def students():
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
    except ValueError:
        raise BadRequest('Paginación inválida')
    if page < 1 or not 1 <= per_page <= 100:
        raise BadRequest('page >= 1; per_page entre 1 y 100')
    db = session()
    rows = db.scalars(select(Student).order_by(Student.id).offset((page - 1) * per_page).limit(per_page))
    return jsonify(items=[{'id': row.id, 'source': 'UCI 697'} for row in rows],
                   page=page, per_page=per_page, total=db.scalar(select(func.count(Student.id))))

@bp.get('/students/<int:student_id>')
def student(student_id):
    return jsonify(serialize(get_student(student_id)))
