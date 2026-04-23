from flask import Blueprint

blueprint = Blueprint("pr_monitoring_habitat_station", __name__)

from .routes import transects, visits, stations, sensors, habitats