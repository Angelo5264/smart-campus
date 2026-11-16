import hashlib
import pandas as pd
from sqlalchemy import select
from app.extensions import session
from app.models import Student
from ml.download_dataset import DATA_PATH, audit


def import_students():
    df = pd.read_csv(DATA_PATH)
    audit(df)
    fingerprint = hashlib.sha256(DATA_PATH.read_bytes()).hexdigest()
    db = session()
    existing = set(db.scalars(select(Student.source_key)))
    count = 0
    for index, row in df.iterrows():
        key = f'uci697:{fingerprint}:{index}'
        if key not in existing:
            db.add(Student(source_key=key, features=row.drop('Target').to_dict(), target=row.Target))
            count += 1
    # A changed source must not silently create a second cohort.
    if existing and any(not key.startswith(f'uci697:{fingerprint}:') for key in existing):
        db.rollback()
        raise ValueError('El archivo fuente cambió; use una base nueva para otra versión')
    db.commit()
    return count
