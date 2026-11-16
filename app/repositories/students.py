from werkzeug.exceptions import NotFound
from app.extensions import session
from app.models import Student


def get_student(student_id):
    student = session().get(Student, student_id)
    if student is None:
        raise NotFound('Estudiante no encontrado')
    return student


def serialize(student):
    return {'id': student.id, 'source': 'UCI 697', 'features': student.features,
            'observed_target': student.target, 'identity': 'anonymous_dataset_record'}
