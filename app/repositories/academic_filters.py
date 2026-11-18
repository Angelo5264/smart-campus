"""Availability describes recorded values, never progression or dropout risk."""
from sqlalchemy import and_, or_, not_, case, cast, Float, func, select
from werkzeug.exceptions import BadRequest
from app.models import Student

FIELDS = {s: [f'Curricular units {s} sem ({m})' for m in ['enrolled', 'approved', 'evaluations', 'grade']] for s in ['1st', '2nd']}
OPTIONS = {
    'academic_data': {'all', 'complete', 'partial', 'none'},
    'semester_availability': {'all', 'first_only', 'second_only', 'both', 'none'},
    'evaluation_status': {'all', 'with', 'without', 'zero', 'unknown'},
    'approval_status': {'all', 'with', 'without', 'zero', 'unknown'},
    'evaluation_semester': {'any', 'first', 'second'},
    'approval_semester': {'any', 'first', 'second'},
}


def parse_filters(args):
    result = {}
    for key, options in OPTIONS.items():
        default = 'any' if key.endswith('_semester') else 'all'
        value = args.get(key, default)
        if value not in options or len(args.getlist(key)) > 1:
            raise BadRequest(f'{key}: valor inválido; opciones: {", ".join(sorted(options))}')
        result[key] = value
    return result


def numeric_field(key, dialect):
    field = Student.features[key]
    if dialect == 'postgresql':
        numeric = func.coalesce(func.json_typeof(field) == 'number', False)
    else:
        # json_type distinguishes JSON null, strings, booleans and absent paths.
        numeric = func.coalesce(func.json_type(Student.features, f'$."{key}"').in_(['integer', 'real']), False)
    # CASE prevents PostgreSQL from casting non-numeric strings/objects.
    value = case((numeric, cast(field.as_string(), Float)), else_=None)
    return numeric, value


def expressions(dialect):
    available = {s: [numeric_field(k, dialect)[0] for k in keys] for s, keys in FIELDS.items()}
    all_fields = available['1st'] + available['2nd']
    complete = and_(*all_fields)
    any_field = or_(*all_fields)
    first, second = or_(*available['1st']), or_(*available['2nd'])
    return {
        'academic_data': {'complete': complete, 'none': not_(any_field), 'partial': and_(any_field, not_(complete))},
        'semester_availability': {'first_only': and_(first, not_(second)), 'second_only': and_(second, not_(first)), 'both': and_(first, second), 'none': and_(not_(first), not_(second))},
    }


def conditions(filters, dialect, categories):
    predicates = []
    for key in ['academic_data', 'semester_availability']:
        if filters[key] != 'all':
            predicates.append(categories[key][filters[key]])
    for prefix, measure in [('evaluation', 'evaluations'), ('approval', 'approved')]:
        status = filters[f'{prefix}_status']
        if status == 'all':
            continue
        scope = filters[f'{prefix}_semester']
        semesters = ['1st', '2nd'] if scope == 'any' else ['1st' if scope == 'first' else '2nd']
        fields = [numeric_field(f'Curricular units {s} sem ({measure})', dialect) for s in semesters]
        positive = or_(*(func.coalesce(value > 0, False) for _, value in fields))
        zero = and_(*(and_(known, func.coalesce(value == 0, False)) for known, value in fields))
        unknown = or_(*(not_(known) for known, _ in fields))
        predicates.append({'with': positive, 'without': not_(positive), 'zero': zero, 'unknown': unknown}[status])
    return predicates


def list_students(db, page, per_page, filters):
    categories = expressions(db.bind.dialect.name)
    predicates = conditions(filters, db.bind.dialect.name, categories)
    # Global cards are independent of filters; COUNT is calculated in SQL.
    stats = db.execute(select(
        func.count(Student.id).label('total'),
        *(func.coalesce(func.sum(case((condition, 1), else_=0)), 0).label(key)
          for key, condition in categories['academic_data'].items()),
    )).mappings().one()
    total = db.scalar(select(func.count(Student.id)).where(*predicates)) if predicates else stats['total']
    rows = db.execute(select(Student.id).where(*predicates).order_by(Student.id)
                      .offset((page - 1) * per_page).limit(per_page)).all()
    return {'items': [{'id': row.id, 'source': 'UCI 697'} for row in rows],
            'page': page, 'per_page': per_page, 'total': total,
            'academic_summary': dict(stats), 'filters': filters,
            'availability_definition': 'numeric_values_v1', 'summary_scope': 'all_students'}
