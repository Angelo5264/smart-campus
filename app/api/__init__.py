from . import health_routes, student_routes, prediction_routes, clustering_routes, analytics_routes
blueprints = [module.bp for module in [health_routes, student_routes, prediction_routes, clustering_routes, analytics_routes]]
