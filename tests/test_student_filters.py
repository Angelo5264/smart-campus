"""Synthetic edge cases are confined to the isolated test database, never UCI."""
import pytest
from sqlalchemy import event
from app.extensions import session
from app.models import Student
from app.repositories.academic_filters import FIELDS


@pytest.fixture()
def cohort(app):
    first, second = FIELDS['1st'], FIELDS['2nd']
    zero = {key: 0 for key in first + second}
    records = [
        zero,
        {**zero, first[2]: 3, second[1]: 2},
        {key: 0 for key in first},
        {key: None for key in first + second},
        {},
        {key: '' for key in first + second},
        {second[3]: 0},
        {first[0]: 1, second[0]: 1},
        {key: False for key in first + second},
        {key: '0' for key in first + second},
    ]
    with app.app_context():
        db = session()
        for i, features in enumerate(records, 1):
            db.add(Student(id=i, source_key=f'isolated-filter-test:{i}', features=features, target='Enrolled'))
        db.commit()
    return records


def ids(client, query):
    response = client.get('/api/v1/students?' + query)
    assert response.status_code == 200, response.json
    return [item['id'] for item in response.json['items']]


def test_compatible_listing_and_global_counts(client, cohort):
    response = client.get('/api/v1/students').json
    assert response['total'] == 10
    assert response['items'][0] == {'id': 1, 'source': 'UCI 697'}
    assert response['academic_summary'] == {'total': 10, 'complete': 2, 'partial': 3, 'none': 5}
    assert response['summary_scope'] == 'all_students'


@pytest.mark.parametrize('query,expected', [
    ('academic_data=complete', [1, 2]),
    ('academic_data=partial', [3, 7, 8]),
    ('academic_data=none', [4, 5, 6, 9, 10]),
    ('semester_availability=first_only', [3]),
    ('semester_availability=second_only', [7]),
    ('semester_availability=both', [1, 2, 8]),
    ('semester_availability=none', [4, 5, 6, 9, 10]),
    ('evaluation_status=with', [2]),
    ('evaluation_status=without', [1, 3, 4, 5, 6, 7, 8, 9, 10]),
    ('evaluation_status=zero', [1]),
    ('evaluation_status=unknown', [3, 4, 5, 6, 7, 8, 9, 10]),
    ('approval_status=with', [2]),
    ('approval_status=with&approval_semester=first', []),
    ('approval_status=zero&approval_semester=second', [1]),
    ('academic_data=partial&semester_availability=first_only&evaluation_status=without&evaluation_semester=second', [3]),
    ('academic_data=complete&semester_availability=none', []),
])
def test_filters(client, cohort, query, expected):
    assert ids(client, query) == expected


def test_pagination_after_filtering_and_counts(client, cohort):
    response = client.get('/api/v1/students?academic_data=partial&page=2&per_page=1').json
    assert response['total'] == 3
    assert response['items'] == [{'id': 7, 'source': 'UCI 697'}]
    assert response['academic_summary']['total'] == 10
    assert response['page'] == 2
    assert ids(client, 'academic_data=partial&page=10&per_page=1') == []


@pytest.mark.parametrize('query', ['academic_data=invalid', 'evaluation_semester=third', 'approval_status=', 'academic_data=none&academic_data=complete'])
def test_invalid_filters(client, query):
    assert client.get('/api/v1/students?' + query).status_code == 400


def test_empty_database(client):
    response = client.get('/api/v1/students?academic_data=partial').json
    assert response['academic_summary'] == dict(total=0, complete=0, partial=0, none=0)
    assert response['total'] == 0 and response['items'] == []


def test_fixed_query_count_and_sql_pagination(app, client, cohort):
    statements = []
    engine = app.extensions['engine']
    def capture(conn, cursor, statement, parameters, context, executemany):
        statements.append(statement)
    event.listen(engine, 'before_cursor_execute', capture)
    try:
        response = client.get('/api/v1/students?academic_data=partial&per_page=1')
        assert response.status_code == 200
        assert len(statements) == 3
        assert 'LIMIT' in statements[-1].upper()
        # Only IDs are loaded for a page; no per-row student/detail queries.
        selected = statements[-1].split('FROM', 1)[0].strip()
        assert selected.startswith('SELECT ') and selected.endswith('students.id')
        assert ',' not in selected
    finally:
        event.remove(engine, 'before_cursor_execute', capture)
