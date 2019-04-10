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

from .models import HabrefSHS, TTransect, TPlot, TRelevePlot

blueprint = Blueprint('pr_monitoring_habitat_station', __name__)

@blueprint.route('/sites', methods=['GET'])
@json_resp
def get_all_sites():
    '''
    Retourne tous les sites
    '''
    parameters = request.args

    id_type_commune = blueprint.config['id_type_commune']

    q = (
        DB.session.query(
            TTransect,
            HabrefSHS.lb_hab_fr_complet,
            func.string_agg(distinct(BibOrganismes.nom_organisme), ', '),
            ).outerjoin(
                HabrefSHS, TTransect.cd_hab == HabrefSHS.cd_hab
            )
            .group_by(
                TTransect, HabrefSHS.lb_hab_fr_complet
            )
        )

    if 'cd_hab' in parameters:
        q = q.filter(TTransect.cd_hab == parameters['cd_hab'])

    if 'id_base_site' in parameters:
        q = q.filter(TTransect.id_base_site == parameters['id_base_site'])

    page = request.args.get('page', 1, type=int)
    items_per_page = blueprint.config['items_per_page']
    pagination_serverside = blueprint.config['pagination_serverside']

    if (pagination_serverside):
        pagination = q.paginate(page, items_per_page, False)
        data = pagination.items
        totalItmes = pagination.total
    else:
        totalItmes = 0
        data = q.all()

    pageInfo= {
        'totalItmes' : totalItmes,
        'items_per_page' : items_per_page,
    }
    features = []


    if data:
        for d in data:
            feature = d[0].get_geofeature()
            print("feature: ", feature)
            id_site = feature['properties']['id_base_site']
            base_site_code = feature['properties']['t_base_site']['base_site_code']
            base_site_description = feature['properties']['t_base_site']['base_site_description'] or 'Aucune description'
            base_site_name = feature['properties']['t_base_site']['base_site_name']
            if feature['properties']['t_base_site']:
                            del feature['properties']['t_base_site']
            feature['properties']['organisme'] = 'Aucun'
            feature['properties']['base_site_code'] = base_site_code
            feature['properties']['base_site_description'] = base_site_description
            feature['properties']['base_site_name'] = base_site_name
            features.append(feature)

        return [pageInfo,FeatureCollection(features)]
    return None