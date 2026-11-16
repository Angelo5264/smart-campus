from app.services.prediction_service import predict


def assign_cluster(payload):
    return predict(payload, name='kmeans')
