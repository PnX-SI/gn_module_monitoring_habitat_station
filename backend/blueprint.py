import json
import datetime

from flask import Blueprint, request, session, current_app, send_from_directory, abort, jsonify
from geojson import FeatureCollection, Feature
from sqlalchemy.sql.expression import func
from sqlalchemy import and_ , distinct, desc
from sqlalchemy.exc import SQLAlchemyError
from geoalchemy2.shape import to_shape

from pypnusershub.db.tools import InsufficientRightsError
from pypnnomenclature.models import TNomenclatures
from pypnusershub.db.models import User
 
from geonature.utils.env import DB, ROOT_DIR
from geonature.utils.utilsgeometry import FionaShapeService
from geonature.utils.utilssqlalchemy import json_resp, to_json_resp, to_csv_resp
from geonature.core.gn_permissions import decorators as permissions
from geonature.core.gn_permissions.tools import get_or_fetch_user_cruved
from geonature.core.gn_monitoring.models import corVisitObserver, corSiteArea, corSiteModule, TBaseVisits
from geonature.core.ref_geo.models import LAreas
from geonature.core.users.models import BibOrganismes


from .repositories import check_user_cruved_visit, check_year_visit

#from .models import TInfosSite, Habref, CorHabitatTaxon, Taxonomie, TVisitSHT, TInfosSite, CorVisitTaxon, CorVisitPerturbation, CorListHabitat, ExportVisits

blueprint = Blueprint('pr_monitoring_habitat_station', __name__)