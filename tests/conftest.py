import os
import pytest
from app import create_app
from app.models import Base


@pytest.fixture()
def app(tmp_path):
    # PostgreSQL integration uses an isolated schema, never drops application tables.
    url = os.getenv('TEST_DATABASE_URL', f'sqlite:///{tmp_path / "test.db"}')
    application = create_app({'TESTING': True, 'DATABASE_URL': url})
    engine = application.extensions['engine']
    schema = None
    if engine.dialect.name == 'postgresql':
        import uuid
        from sqlalchemy import text
        schema = 'test_' + uuid.uuid4().hex
        with engine.begin() as conn:
            conn.execute(text(f'CREATE SCHEMA {schema}'))
        engine = engine.execution_options(schema_translate_map={None: schema})
        application.extensions['engine'] = engine
    Base.metadata.create_all(engine)
    yield application
    Base.metadata.drop_all(engine)
    if schema:
        from sqlalchemy import text
        with engine.begin() as conn:
            conn.execute(text(f'DROP SCHEMA {schema}'))
    engine.dispose()


@pytest.fixture()
def client(app):
    return app.test_client()
