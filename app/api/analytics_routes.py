from flask import Blueprint, jsonify
from sqlalchemy import select, func
from app.extensions import session
from app.models import Student, Prediction, ClusterAssignment
from app.services.artifacts import artifact

bp = Blueprint('analytics', __name__)

@bp.get('/analytics/summary')
def summary():
    db = session()
    return jsonify(students=db.scalar(select(func.count(Student.id))),
                   observed_targets=dict(db.execute(select(Student.target, func.count()).group_by(Student.target)).all()),
                   predictions=db.scalar(select(func.count(Prediction.id))),
                   cluster_assignments=db.scalar(select(func.count(ClusterAssignment.id))),
                   prediction_mode='EXPERIMENTAL')

@bp.get('/models/metrics')
def metrics():
    return jsonify({name: artifact(name)['metadata'] for name in ['random_forest', 'kmeans']})
