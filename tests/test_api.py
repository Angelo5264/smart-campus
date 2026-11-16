import math
from pathlib import Path
import pytest
from sqlalchemy import select, func
from app.config import ROOT
from app.extensions import session
from app.models import Prediction, ClusterAssignment, ModelRun
from app.services.student_service import import_students
from app.services.prediction_service import risk_level
from app.services.artifacts import load_artifact
from app.schemas import validate_features
from werkzeug.exceptions import BadRequest


def test_health_pagination_errors(client):
    assert client.get('/api/v1/health').json['status'] == 'UP'
    assert client.get('/api/v1/students').json['total'] == 0
    for query in ['page=0', 'page=x', 'per_page=101']:
        assert client.get('/api/v1/students?' + query).status_code == 400
    assert client.get('/api/v1/students/999999').status_code == 404
    assert client.post('/api/v1/predictions', json={}).status_code == 400
    assert client.post('/api/v1/predictions', json={'student_id': True}).status_code == 400
    assert client.post('/api/v1/predictions', data='x', content_type='application/json').status_code == 400
    assert client.get('/missing').json['error']['code'] == 404


def test_missing_model(app, client, tmp_path):
    app.config['ARTIFACT_DIR'] = str(tmp_path)
    response = client.post('/api/v1/predictions', json={'features': {}})
    assert response.status_code == 503
    assert 'Predicción no disponible' in response.json['error']['message']
    assert 'dropout_probability' not in response.json


def test_threshold_boundaries():
    assert [risk_level(p, .3, .7) for p in [0, .299, .3, .699, .7, 1]] == ['LOW', 'LOW', 'MEDIUM', 'MEDIUM', 'HIGH', 'HIGH']


@pytest.mark.parametrize('value', [None, True, '3', math.nan, math.inf, 1.5, -1, 11])
def test_feature_validation(value):
    with pytest.raises(BadRequest):
        validate_features({'x': value}, {'x': {'integer': True, 'min': 0, 'max': 10}})


def test_full_flow(app, client):
    required = [ROOT / 'data/raw/students.csv', ROOT / 'ml/artifacts/random_forest.json', ROOT / 'ml/artifacts/kmeans.json']
    if not all(path.exists() for path in required):
        pytest.skip('Descargue UCI y entrene ambos modelos para la integración completa')
    with app.app_context():
        assert import_students() == 4424
        assert import_students() == 0
    listing = client.get('/api/v1/students?per_page=2').json
    assert listing['total'] == 4424 and len(listing['items']) == 2
    student_id = listing['items'][0]['id']
    detail = client.get(f'/api/v1/students/{student_id}').json
    assert len(detail['features']) == 36 and 'Target' not in detail['features']
    assert client.get(f'/api/v1/predictions/{student_id}').status_code == 404
    response = client.post('/api/v1/predictions', json={'student_id': student_id})
    assert response.status_code == 201, response.json
    prediction = response.json
    assert 0 <= prediction['dropout_probability'] <= 1
    assert prediction['prediction_mode'] == 'EXPERIMENTAL'
    assert prediction['created_at'].endswith('+00:00')
    assert client.get(f'/api/v1/predictions/{student_id}').json == prediction
    direct = client.post('/api/v1/predictions', json={'features': detail['features']})
    assert direct.status_code == 201
    assert direct.json['dropout_probability'] == prediction['dropout_probability']
    features = detail['features'].copy()
    features.pop('Course')
    assert client.post('/api/v1/predictions', json={'features': features}).status_code == 400
    features = {**detail['features'], 'Target': 'Dropout'}
    assert client.post('/api/v1/predictions', json={'features': features}).status_code == 400
    cluster = client.post('/api/v1/clusters/predict', json={'student_id': student_id})
    assert cluster.status_code == 201, cluster.json
    assert 'risk_level' not in cluster.json
    profiles = client.get('/api/v1/clusters').json['profiles']
    assert cluster.json['cluster'] in [p['cluster'] for p in profiles]
    metrics = client.get('/api/v1/models/metrics').json
    assert metrics['random_forest']['metrics']['test_rows'] == 726
    assert 'Target' not in metrics['kmeans']['features']
    summary = client.get('/api/v1/analytics/summary').json
    assert summary['students'] == 4424
    assert summary['predictions'] == 2
    with app.app_context():
        assert session().scalar(select(func.count(Prediction.id))) == 2
        assert session().scalar(select(func.count(ClusterAssignment.id))) == 1
        assert session().scalar(select(func.count(ModelRun.id))) == 2


def test_unknown_category():
    with pytest.raises(BadRequest):
        validate_features({'Course': 2}, {'Course': {'integer': True, 'min': 1, 'max': 3, 'categories': [1, 3]}})


def test_database_unavailable(app, client, monkeypatch):
    from sqlalchemy.exc import OperationalError
    from app.api import health_routes

    class BrokenSession:
        def execute(self, query):
            raise OperationalError('SELECT 1', {}, Exception('offline'))

    monkeypatch.setattr(health_routes, 'session', lambda: BrokenSession())
    response = client.get('/api/v1/health')
    assert response.status_code == 503
    assert response.json['error']['message'] == 'Base de datos no disponible'


def test_dataset_schema_rejects_changes():
    import pandas as pd
    from ml.download_dataset import DATA_PATH, audit
    if not DATA_PATH.exists():
        pytest.skip('Descargue UCI para auditar columnas')
    df = pd.read_csv(DATA_PATH)
    with pytest.raises(ValueError, match='columnas'):
        audit(df.rename(columns={'Course': 'invented_course'}))
    df.loc[0, 'Course'] = float('nan')
    with pytest.raises(ValueError, match='faltantes'):
        audit(df)
