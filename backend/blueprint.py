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

from .models import HabrefSHS, TTransect, TPlot, TRelevePlot, TVisitSHS

blueprint = Blueprint('pr_monitoring_habitat_station', __name__)

@blueprint.route('/sites', methods=['GET'])
@json_resp
def get_all_sites():
    '''
    Retourne tous les sites
    '''
    parameters = request.args

    q = (
        DB.session.query(
            TTransect,
            func.max(TBaseVisits.visit_date_min),
            HabrefSHS.lb_hab_fr_complet,
            func.count(distinct(TBaseVisits.id_base_visit)),
            func.string_agg(distinct(BibOrganismes.nom_organisme), ', ')
            ).outerjoin(
                TBaseVisits, TBaseVisits.id_base_site == TTransect.id_base_site
            )
            # get habitat
            .outerjoin(
                HabrefSHS, TTransect.cd_hab == HabrefSHS.cd_hab
            )
            # get organisme
            .outerjoin(
                corVisitObserver, corVisitObserver.c.id_base_visit == TBaseVisits.id_base_visit
            ).outerjoin(
                User, User.id_role == corVisitObserver.c.id_role
            ).outerjoin(
                BibOrganismes, BibOrganismes.id_organisme == User.id_organisme
            )
            .group_by(
                TTransect, HabrefSHS.lb_hab_fr_complet
            )
        )

    if 'cd_hab' in parameters:
        q = q.filter(TTransect.cd_hab == parameters['cd_hab'])

    if 'id_base_site' in parameters:
        q = q.filter(TTransect.id_base_site == parameters['id_base_site'])

    if 'year' in parameters:
        # relance la requête pour récupérer la date_max exacte si on filtre sur l'année
        q_year = (
            DB.session.query(
                TTransect.id_base_site,
                func.max(TBaseVisits.visit_date_min),
            ).outerjoin(
                TBaseVisits, TBaseVisits.id_base_site == TTransect.id_base_site
            ).group_by(TTransect.id_base_site)
        )

        data_year = q_year.all()

        q = q.filter(func.date_part('year', TBaseVisits.visit_date_min) == parameters['year'])


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
            feature = d[0].get_geofeature(True)
            id_site = feature['properties']['id_base_site']
            base_site_code = feature['properties']['t_base_site']['base_site_code']
            base_site_description = feature['properties']['t_base_site']['base_site_description'] or 'Aucune description'
            base_site_name = feature['properties']['t_base_site']['base_site_name']
            if feature['properties']['t_base_site']:
                del feature['properties']['t_base_site']

            if 'year' in parameters:
                for dy in data_year:
                    #  récupérer la bonne date max du site si on filtre sur année
                    if id_site == dy[0]:
                        feature['properties']['date_max'] = str(d[1])
            else:
                feature['properties']['date_max'] = str(d[1])
                if d[1] == None:
                    feature['properties']['date_max'] = 'Aucune visite'

            feature['properties']['nom_habitat'] = str(d[2])
            feature['properties']['nb_visit'] = str(d[3])

            if d[4] == None:
                feature['properties']['organisme'] = 'Aucun'

            feature['properties']['organisme'] = 'Aucun'
            feature['properties']['base_site_code'] = base_site_code
            feature['properties']['base_site_description'] = base_site_description
            feature['properties']['base_site_name'] = base_site_name
            features.append(feature)

        return [pageInfo,FeatureCollection(features)]
    return None


@blueprint.route('/sites/<id_site>', methods=['GET'])
@json_resp
def get_site(id_site):
    '''
    Retourne un site à l'aide de son id
    '''

    id_type_commune = blueprint.config['id_type_commune']

    data = DB.session.query(
        TTransect,
        TNomenclatures,
        func.string_agg(distinct(LAreas.area_name), ', '),
        func.string_agg(distinct(BibOrganismes.nom_organisme), ', '),
        HabrefSHS.lb_hab_fr_complet
    ).filter_by(id_transect = id_site
    ).outerjoin(
        TBaseVisits, TBaseVisits.id_base_site == TTransect.id_base_site
    ).outerjoin(
        TNomenclatures, TTransect.id_nomenclature_plot_position == TNomenclatures.id_nomenclature
     # get habitat
    ).outerjoin(
        HabrefSHS, TTransect.cd_hab == HabrefSHS.cd_hab
    # get organisme
    ).outerjoin(
        corVisitObserver, corVisitObserver.c.id_base_visit == TBaseVisits.id_base_visit
    ).outerjoin(
        User, User.id_role == corVisitObserver.c.id_role
    ).outerjoin(
        BibOrganismes, BibOrganismes.id_organisme == User.id_organisme
    # get municipalities of a site
    ).outerjoin(
        corSiteArea, corSiteArea.c.id_base_site == TTransect.id_base_site
    ).outerjoin(
        LAreas, and_(LAreas.id_area == corSiteArea.c.id_area, LAreas.id_type == id_type_commune)
    ).group_by(TTransect.id_transect, TNomenclatures.id_nomenclature, HabrefSHS.lb_hab_fr_complet
    ).first()

    plots = DB.session.query(TPlot).filter_by(id_transect = id_site)

    site = []
    if data:
        transect = data[0].get_geofeature(True)
        plot_position = data[1].as_dict()
        transect['properties']['plot_position'] = plot_position
        if data[2]:
            transect['properties']['nom_commune'] = str(data[2])
        if data[3]:
            transect['properties']['observers'] = str(data[3])
        if data[4]:
            transect['properties']['nom_habitat'] = str(data[4])
        if(plots):
            transect['properties']['plots'] = [p.as_dict() for p in plots]
        site.append(transect)
        return site
    return None