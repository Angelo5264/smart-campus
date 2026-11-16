from flask import current_app, g
from sqlalchemy.orm import Session


def session():
    if 'db' not in g:
        g.db = Session(current_app.extensions['engine'])
    return g.db
