"""Live HTTP smoke test; creates one prediction and one cluster assignment."""
import json
import os
from urllib.request import Request, urlopen

base = os.getenv('API_BASE_URL', 'http://127.0.0.1:5000/api/v1')


def call(path, payload=None):
    data = None if payload is None else json.dumps(payload).encode()
    request = Request(base + path, data=data, headers={'Content-Type': 'application/json'})
    with urlopen(request, timeout=30) as response:
        result = json.load(response)
        print(f'{request.get_method()} {path}: {response.status}')
        return result


assert call('/health')['status'] == 'UP'
listing = call('/students?per_page=1')
assert listing['total'] == 4424
student_id = listing['items'][0]['id']
assert len(call(f'/students/{student_id}')['features']) == 36
prediction = call('/predictions', {'student_id': student_id})
assert prediction['prediction_mode'] == 'EXPERIMENTAL'
assert 0 <= prediction['dropout_probability'] <= 1
assert call(f'/predictions/{student_id}')['id'] == prediction['id']
cluster = call('/clusters/predict', {'student_id': student_id})
assert 'risk_level' not in cluster
assert call('/clusters')['profiles']
assert call('/analytics/summary')['students'] == 4424
assert call('/models/metrics')['random_forest']['metrics']['test_rows'] > 0
print('Flujo HTTP completo correcto')
