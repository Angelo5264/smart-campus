from ml.preprocess import CATEGORICAL

NUMERIC = [
    'Application order', 'Previous qualification (grade)', 'Admission grade',
    'Age at enrollment',
    *[f'Curricular units {semester} sem ({measure})'
      for semester in ['1st', '2nd']
      for measure in ['credited', 'enrolled', 'evaluations', 'approved', 'grade', 'without evaluations']],
    'Unemployment rate', 'Inflation rate', 'GDP',
]
FEATURE_COLUMNS = set(CATEGORICAL + NUMERIC)
