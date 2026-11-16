from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.pipeline import Pipeline
from ml.common import SEED, load_data, save_artifact
from ml.preprocess import preprocessor


def main():
    df = load_data()
    # Academic profiles: all 12 semester variables plus course and admission grade.
    columns = [c for c in df if c.startswith('Curricular units')]
    columns += ['Course', 'Admission grade']
    X = df[columns]
    transform = preprocessor(columns)
    transformed = transform.fit_transform(X)
    candidates = {}
    models = {}
    for k in range(2, 7):
        model = KMeans(n_clusters=k, random_state=SEED, n_init=10)
        labels = model.fit_predict(transformed)
        candidates[k] = float(silhouette_score(transformed, labels, sample_size=min(1500, len(X)), random_state=SEED))
        models[k] = model
    best = max(candidates, key=candidates.get)
    model = models[best]
    pipeline = Pipeline([('preprocess', transform), ('model', model)])
    profiles = []
    for label in range(best):
        group = X[model.labels_ == label]
        profiles.append({'cluster': label, 'count': len(group),
                         'numeric_means': group.drop(columns='Course').mean().to_dict(),
                         'course_counts': group.Course.value_counts().to_dict()})
    metrics = {'selected_k': best, 'silhouette_by_k': candidates, 'profiles': profiles,
               'rows': len(X), 'interpretation': 'Academic profiles, not risk levels; internal exploratory evaluation'}
    save_artifact('kmeans', pipeline, columns, metrics, df)

if __name__ == '__main__':
    main()
