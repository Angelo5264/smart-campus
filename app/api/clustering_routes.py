from flask import Blueprint, jsonify, request
from app.services.clustering_service import assign_cluster
from app.services.artifacts import artifact

bp = Blueprint('clusters', __name__)

@bp.post('/clusters/predict')
def cluster_predict():
    return jsonify(assign_cluster(request.get_json())), 201

@bp.get('/clusters')
def clusters():
    metadata = artifact('kmeans')['metadata']
    return jsonify(model_version=metadata['model_version'], prediction_mode='EXPERIMENTAL',
                   profiles=metadata['metrics']['profiles'], interpretation='Perfiles, no niveles de riesgo')
