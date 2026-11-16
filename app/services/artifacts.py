import json
from functools import lru_cache
from pathlib import Path
import joblib
from flask import current_app
from werkzeug.exceptions import ServiceUnavailable


@lru_cache(maxsize=8)
def load_artifact(directory, name):
    try:
        root = Path(directory)
        metadata = json.loads((root / f'{name}.json').read_text())
        bundle = joblib.load(root / f'{name}-{metadata["model_version"]}.joblib')
        if bundle['metadata'] != metadata:
            raise ValueError('Metadata mismatch')
        return bundle
    except (OSError, ValueError, KeyError, EOFError) as error:
        raise ServiceUnavailable('Predicción no disponible: entrene el modelo y reinicie la API') from error


def artifact(name):
    return load_artifact(current_app.config['ARTIFACT_DIR'], name)
