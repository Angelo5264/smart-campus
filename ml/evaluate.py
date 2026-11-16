from sklearn.metrics import (accuracy_score, precision_score, recall_score,
                             f1_score, roc_auc_score, confusion_matrix)


def evaluate_classifier(y, predicted, probabilities):
    return {
        'accuracy': accuracy_score(y, predicted),
        'precision': precision_score(y, predicted, zero_division=0),
        'recall': recall_score(y, predicted, zero_division=0),
        'f1': f1_score(y, predicted, zero_division=0),
        'roc_auc': roc_auc_score(y, probabilities),
        'confusion_matrix': confusion_matrix(y, predicted, labels=[0, 1]).tolist(),
        'confusion_matrix_labels': ['Graduate (0)', 'Dropout (1)'],
    }
