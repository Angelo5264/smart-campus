import json
from pathlib import Path
import pandas as pd
from ucimlrepo import fetch_ucirepo
from ml.schema import FEATURE_COLUMNS

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / 'data/raw/students.csv'


def audit(df):
    if df.shape != (4424, 37) or 'Target' not in df:
        raise ValueError(f'Estructura UCI inesperada: {df.shape}')
    if set(df.columns) != FEATURE_COLUMNS | {'Target'}:
        raise ValueError('Las columnas originales de UCI han cambiado')
    if set(df.Target.unique()) != {'Dropout', 'Enrolled', 'Graduate'}:
        raise ValueError('Etiquetas UCI inesperadas')
    if df.isna().any().any():
        raise ValueError('Datos faltantes: revisar fuente antes de continuar')
    if not all(pd.api.types.is_numeric_dtype(df[c]) for c in df if c != 'Target'):
        raise ValueError('Se esperaban variables numéricas originales')
    return {'rows': len(df), 'features': 36, 'duplicates': int(df.duplicated().sum()),
            'missing': df.isna().sum().to_dict(), 'dtypes': df.dtypes.astype(str).to_dict(),
            'target_distribution': df.Target.value_counts().to_dict()}


def main():
    dataset = fetch_ucirepo(id=697)
    df = dataset.data.features.join(dataset.data.targets)
    report = audit(df)
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATA_PATH, index=False)
    (DATA_PATH.parent / 'audit.json').write_text(json.dumps(report, indent=2))
    (DATA_PATH.parent / 'variables.json').write_text(dataset.variables.to_json(orient='records', indent=2))
    print(json.dumps(report, indent=2))

if __name__ == '__main__':
    main()
