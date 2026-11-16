import math
from werkzeug.exceptions import BadRequest


def validate_features(features, schema):
    if not isinstance(features, dict) or set(features) != set(schema):
        raise BadRequest('features debe contener exactamente las 36 columnas originales de UCI; consulte el detalle del estudiante')
    for column, rule in schema.items():
        value = features[column]
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            raise BadRequest(f'{column}: se requiere un número finito, sin valores nulos')
        if rule['integer'] and value % 1:
            raise BadRequest(f'{column}: se requiere un entero')
        if rule.get('categories') is not None and value not in rule['categories']:
            raise BadRequest(f'{column}: código categórico desconocido')
        if not rule['min'] <= value <= rule['max']:
            raise BadRequest(f'{column}: fuera del rango observado del dataset de demostración')
    return features
