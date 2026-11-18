from flask import Blueprint, jsonify, request
from werkzeug.exceptions import BadRequest
from app.extensions import session
from app.repositories.students import get_student, serialize
from app.repositories.academic_filters import parse_filters, list_students

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
    filters = parse_filters(request.args)
    return jsonify(list_students(session(), page, per_page, filters))

@bp.get('/students/<int:student_id>')
def student(student_id):
    return jsonify(serialize(get_student(student_id)))
