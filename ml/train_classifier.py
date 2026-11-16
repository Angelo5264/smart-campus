from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from ml.common import SEED, load_data, save_artifact
from ml.preprocess import preprocessor
from ml.evaluate import evaluate_classifier


def main():
    full = load_data()
    df = full[full.Target.isin(['Dropout', 'Graduate'])]
    X = df.drop(columns='Target')
    y = (df.Target == 'Dropout').astype(int)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=SEED)
    pipeline = Pipeline([
        ('preprocess', preprocessor(X.columns)),
        ('model', RandomForestClassifier(n_estimators=200, class_weight='balanced', random_state=SEED, n_jobs=2)),
    ])
    pipeline.fit(X_train, y_train)
    positive_index = list(pipeline.classes_).index(1)
    metrics = evaluate_classifier(y_test, pipeline.predict(X_test), pipeline.predict_proba(X_test)[:, positive_index])
    metrics.update({'train_rows': len(X_train), 'test_rows': len(X_test),
                    'class_distribution': {'Dropout': int(y.sum()), 'Graduate': int((y == 0).sum())},
                    'train_class_distribution': y_train.value_counts().to_dict(),
                    'test_class_distribution': y_test.value_counts().to_dict(),
                    'excluded_enrolled': int((full.Target == 'Enrolled').sum()),
                    'evaluation': 'Stratified random holdout; not temporal or external validation'})
    save_artifact('random_forest', pipeline, X.columns, metrics, full)

if __name__ == '__main__':
    main()
