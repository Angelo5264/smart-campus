import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
import joblib
import pandas as pd
import sklearn
from ml.download_dataset import DATA_PATH, ROOT, audit
from ml.preprocess import CATEGORICAL

ARTIFACT_DIR = ROOT / 'ml/artifacts'
SEED = 42


def load_data():
    df = pd.read_csv(DATA_PATH)
    audit(df)
    # Remove identical feature vectors before splitting, so copies cannot leak.
    return df.drop_duplicates(subset=[c for c in df if c != 'Target'])


def save_artifact(name, pipeline, columns, metrics, df):
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    fingerprint = hashlib.sha256(DATA_PATH.read_bytes()).hexdigest()
    timestamp = datetime.now(timezone.utc)
    version = timestamp.strftime('%Y%m%dT%H%M%S%fZ') + '-' + fingerprint[:8]
    schema = {
        c: {'integer': bool((df[c] % 1 == 0).all()),
            'min': float(df[c].min()), 'max': float(df[c].max()),
            'categories': sorted(df[c].unique().tolist()) if c in CATEGORICAL else None}
        for c in df if c != 'Target'
    }
    metadata = {'model': name, 'model_version': version, 'prediction_mode': 'EXPERIMENTAL',
                'created_at': timestamp.isoformat(), 'dataset': 'UCI 697',
                'dataset_sha256': fingerprint, 'seed': SEED,
                'sklearn_version': sklearn.__version__, 'features': list(columns),
                'schema': schema, 'metrics': metrics}
    metadata = json.loads(json.dumps(metadata, allow_nan=False))
    # Publish metadata only after the matching versioned artifact exists.
    joblib.dump({'pipeline': pipeline, 'metadata': metadata}, ARTIFACT_DIR / f'{name}-{version}.joblib')
    temporary = ARTIFACT_DIR / f'{name}.json.tmp'
    temporary.write_text(json.dumps(metadata, indent=2, allow_nan=False))
    temporary.replace(ARTIFACT_DIR / f'{name}.json')
    print(json.dumps(metadata['metrics'], indent=2))
