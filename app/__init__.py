import click
from flask import Flask, g, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from werkzeug.exceptions import HTTPException
from app.config import Config
from app.models import Base


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config.update(config or {})
    if not app.config['DATABASE_URL']:
        raise RuntimeError('Configure DATABASE_URL; consulte .env.example')
    if not 0 <= app.config['RISK_LOW_THRESHOLD'] < app.config['RISK_HIGH_THRESHOLD'] <= 1:
        raise ValueError('Umbrales de riesgo inválidos')
    app.extensions['engine'] = create_engine(app.config['DATABASE_URL'], pool_pre_ping=True)
    CORS(app, resources={r'/api/*': {'origins': app.config['CORS_ORIGINS']}})
    from app.api import blueprints
    for blueprint in blueprints:
        app.register_blueprint(blueprint, url_prefix='/api/v1')

    @app.teardown_appcontext
    def close_session(error=None):
        db = g.pop('db', None)
        if db:
            db.close()

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error={'code': error.code, 'message': error.description}), error.code

    @app.errorhandler(SQLAlchemyError)
    def database_error(error):
        app.logger.exception('Database operation failed')
        return jsonify(error={'code': 503, 'message': 'Base de datos no disponible'}), 503

    @app.errorhandler(Exception)
    def unexpected_error(error):
        app.logger.exception('Unexpected application error')
        return jsonify(error={'code': 500, 'message': 'Error interno del servicio'}), 500

    @app.cli.command('init-db')
    def init_db():
        Base.metadata.create_all(app.extensions['engine'])
        click.echo('Tablas listas')

    @app.cli.command('import-dataset')
    def import_dataset():
        from app.services.student_service import import_students
        click.echo(f'Registros nuevos: {import_students()}')

    return app
