from datetime import timezone
import pandas as pd
from flask import current_app
from sqlalchemy import select
from werkzeug.exceptions import BadRequest
from app.extensions import session
from app.models import ModelRun, Prediction, ClusterAssignment
from app.repositories.students import get_student
from app.schemas import validate_features
from app.services.artifacts import artifact


def risk_level(probability, low, high):
    return 'LOW' if probability < low else 'HIGH' if probability >= high else 'MEDIUM'


def predict(payload, name='random_forest'):
    if not isinstance(payload, dict) or set(payload) not in ({'student_id'}, {'features'}):
        raise BadRequest('Envíe exclusivamente student_id o features')
    student_id = payload.get('student_id')
    if 'student_id' in payload:
        if type(student_id) is not int or student_id <= 0:
            raise BadRequest('student_id debe ser entero positivo')
        features = get_student(student_id).features
    else:
        features = payload['features']
    bundle = artifact(name)
    metadata = bundle['metadata']
    validate_features(features, metadata['schema'])
    frame = pd.DataFrame([features])[metadata['features']]
    result = {'student_id': student_id, 'model': name, 'model_version': metadata['model_version'],
              'prediction_type': 'experimental', 'prediction_mode': 'EXPERIMENTAL',
              'scope': 'UCI Portugal; no validado para Piura; requiere información del segundo semestre'}
    if name == 'random_forest':
        pipeline = bundle['pipeline']
        p = float(pipeline.predict_proba(frame)[0, list(pipeline.classes_).index(1)])
        low, high = current_app.config['RISK_LOW_THRESHOLD'], current_app.config['RISK_HIGH_THRESHOLD']
        result.update(dropout_probability=p, risk_level=risk_level(p, low, high),
                      thresholds={'low': low, 'high': high, 'status': 'PROVISIONAL'},
                      probability_scope='Dropout vs Graduate; Enrolled excluido; probabilidad no calibrada')
        table = Prediction
    else:
        result.update(cluster=int(bundle['pipeline'].predict(frame)[0]), interpretation='Perfil académico, no nivel de riesgo')
        table = ClusterAssignment
    db = session()
    run = db.scalar(select(ModelRun).where(ModelRun.name == name, ModelRun.version == metadata['model_version']))
    if run is None:
        # Nested transaction tolerates simultaneous first requests for a version.
        from sqlalchemy.exc import IntegrityError
        try:
            with db.begin_nested():
                run = ModelRun(name=name, version=metadata['model_version'], metrics=metadata['metrics'])
                db.add(run)
                db.flush()
        except IntegrityError:
            run = db.scalar(select(ModelRun).where(ModelRun.name == name, ModelRun.version == metadata['model_version']))
    record = table(student_id=student_id, model_run_id=run.id, result=result)
    db.add(record)
    db.commit()
    return serialize_result(record)


def serialize_result(record):
    return {**record.result, 'id': record.id,
            'created_at': record.created_at.replace(tzinfo=timezone.utc).isoformat()}
