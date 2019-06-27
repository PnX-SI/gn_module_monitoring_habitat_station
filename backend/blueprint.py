import json
import datetime

from flask import Blueprint, request, session, current_app, send_from_directory, abort, jsonify
from geojson import FeatureCollection, Feature
from sqlalchemy.sql.expression import func
from sqlalchemy import and_, distinct, desc, func
from sqlalchemy.exc import SQLAlchemyError
from geoalchemy2.shape import to_shape
from numpy import array
from shapely.geometry import *

from pypnusershub.db.tools import InsufficientRightsError
from pypnnomenclature.models import TNomenclatures
from pypnusershub.db.models import User

from geonature.utils.env import DB, ROOT_DIR
from geonature.utils.utilsgeometry import FionaShapeService
from geonature.utils.utilssqlalchemy import json_resp, to_json_resp, to_csv_resp
from geonature.core.gn_permissions import decorators as permissions
from geonature.core.gn_permissions.tools import get_or_fetch_user_cruved
from geonature.core.gn_monitoring.models import corVisitObserver, corSiteArea, corSiteModule, TBaseVisits, TBaseSites
from geonature.core.ref_geo.models import LAreas
from geonature.core.users.models import BibOrganismes


from .repositories import check_user_cruved_visit, check_year_visit, get_taxonlist_by_cdhab, get_stratelist_plot, clean_string, striphtml, get_base_column_name, get_pro_column_name, get_mapping_columns

from .models import HabrefSHS, TTransect, TPlot, TRelevePlot, TVisitSHS, CorTransectVisitPerturbation, CorRelevePlotStrat, CorRelevePlotTaxon, Taxonomie, CorHabTaxon, CorListHabitat, ExportVisits

blueprint = Blueprint('pr_monitoring_habitat_station', __name__)


@blueprint.route('/transects', methods=['GET'])
@json_resp
def get_all_transects():
    '''
    Retourne tous les transects
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

    if 'filterHab' in parameters:
        q = q.filter(TTransect.cd_hab == parameters['filterHab'])

    if ('date_low' in parameters) and ('date_up' in parameters):
        q_date = (
            DB.session.query(
                TTransect.id_base_site,
                func.max(TBaseVisits.visit_date_min),
            ).outerjoin(
                TBaseVisits, TBaseVisits.id_base_site == TTransect.id_base_site
            ).group_by(TTransect.id_base_site).all()
        )
        q = q.filter(
            and_(TBaseVisits.visit_date_min <= parameters['date_up'], TBaseVisits.visit_date_min >= parameters['date_low']))

    page = request.args.get('page', 1, type=int)
    items_per_page = blueprint.config['items_per_page']
    pagination_serverside = blueprint.config['pagination_serverside']
    pagination = q.paginate(page, items_per_page, False)
    totalItmes = pagination.total
    if (pagination_serverside):
        data = pagination.items
    else:
        data = q.all()

    pageInfo = {
        'totalItmes': totalItmes,
        'items_per_page': items_per_page,
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
                for dy in q_date:
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

        return [pageInfo, FeatureCollection(features)]
    return None


@blueprint.route('/transects/<id_site>', methods=['GET'])
@json_resp
def get_transect(id_site):
    '''
    Retourne un transect à l'aide de son id_site
    '''

    id_type_commune = blueprint.config['id_type_commune']

    data = DB.session.query(
        TTransect,
        TNomenclatures,
        func.string_agg(distinct(LAreas.area_name), ', '),
        func.string_agg(distinct(BibOrganismes.nom_organisme), ', '),
        HabrefSHS.lb_hab_fr_complet
    ).filter_by(id_base_site=id_site
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
        LAreas, and_(LAreas.id_area == corSiteArea.c.id_area,
                     LAreas.id_type == id_type_commune)
    ).group_by(TTransect.id_transect, TNomenclatures.id_nomenclature, HabrefSHS.lb_hab_fr_complet
               ).first()

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
        base_site_code = transect['properties']['t_base_site']['base_site_code']
        base_site_description = transect['properties']['t_base_site']['base_site_description'] or 'Aucune description'
        base_site_name = transect['properties']['t_base_site']['base_site_name']
        if transect['properties']['t_base_site']:
            del transect['properties']['t_base_site']
        transect['properties']['base_site_code'] = base_site_code
        transect['properties']['base_site_description'] = base_site_description
        transect['properties']['base_site_name'] = base_site_name
        return transect
    return None


@blueprint.route('/visit', methods=['POST'])
@json_resp
@permissions.check_cruved_scope('C', True, module_code="SUIVI_HAB_STA")
def post_visit(info_role):
    '''
    Poster une nouvelle visite
    '''
    data = dict(request.get_json())
    check_year_visit(data['id_base_site'], data['visit_date_min'][0:4])

    tab_releve_plots = []
    tab_observers = []
    tab_perturbations = []
    tab_plot_data = []

    if 'plots' in data:
        tab_releve_plots = data.pop('plots')
    if 'observers' in data:
        tab_observers = data.pop('observers')
    if 'perturbations' in data:
        if data['perturbations'] != None:
            tab_perturbations = data.pop('perturbations')
        else:
            data.pop('perturbations')
    visit = TVisitSHS(**data)

    for per in tab_perturbations:
        visit_per = CorTransectVisitPerturbation(**per)
        visit.cor_visit_perturbation.append(visit_per)

    for releve in tab_releve_plots:
        if 'plot_data' in releve:
            releve['excretes_presence'] = releve['plot_data']['excretes_presence']
            tab_plot_data = releve.pop('plot_data')
        releve_plot = TRelevePlot(**releve)
        for strat in tab_plot_data['strates_releve']:
            strat_item = CorRelevePlotStrat(**strat)
            releve_plot.cor_releve_strats.append(strat_item)
        for taxon in tab_plot_data['taxons_releve']:
            taxon_item = CorRelevePlotTaxon(**taxon)
            releve_plot.cor_releve_taxons.append(taxon_item)
        visit.cor_releve_plot.append(releve_plot)

    observers = DB.session.query(User).filter(
        User.id_role.in_(tab_observers)
    ).all()
    for o in observers:
        visit.observers.append(o)
    visit.as_dict(True)
    DB.session.add(visit)
    DB.session.commit()
    return visit.as_dict(recursif=True)


@blueprint.route('/site/<id_site>/visits', methods=['GET'])
@json_resp
def get_visits(id_site):
    '''
    Retourne les visites d'un site par son id
    '''
    items_per_page = blueprint.config['items_per_page']
    q = DB.session.query(TVisitSHS).filter_by(id_base_site=id_site)
    pagination = q.paginate()
    totalItmes = pagination.total
    data = q.all()
    pageInfo = {
        'totalItmes': totalItmes,
        'items_per_page': items_per_page,
    }
    if data:
        return [pageInfo, [d.as_dict(True) for d in data]]
    return None


@blueprint.route('/visit/<id_visit>', methods=['GET'])
@json_resp
def get_visitById(id_visit):
    '''
    Retourne les visites d'un site par son id
    '''
    data = DB.session.query(TVisitSHS).filter_by(
        id_base_visit=id_visit).first()
    if data:
        visit = data.as_dict(True)
        for releve in visit['cor_releve_plot']:
            plot_data = dict()
            if 'excretes_presence' in releve:
                plot_data['excretes_presence'] = releve['excretes_presence']
                del releve['excretes_presence']
            if 'cor_releve_taxons' in releve:
                plot_data['taxons_releve'] = releve['cor_releve_taxons']
                del releve['cor_releve_taxons']
            if 'cor_releve_strats' in releve:
                plot_data['strates_releve'] = releve['cor_releve_strats']
                del releve['cor_releve_strats']
            releve['plot_data'] = plot_data
        return visit
    return None


@blueprint.route('/habitats/<cd_hab>/taxons', methods=['GET'])
@json_resp
def get_taxa_by_habitats(cd_hab):
    '''
    tous les taxons d'un habitat
    '''
    q = DB.session.query(
        CorHabTaxon.id_cor_hab_taxon,
        Taxonomie.nom_complet
    ).join(
        Taxonomie, CorHabTaxon.cd_nom == Taxonomie.cd_nom
    ).group_by(CorHabTaxon.id_habitat, CorHabTaxon.id_cor_hab_taxon, Taxonomie.nom_complet)

    q = q.filter(CorHabTaxon.id_habitat == cd_hab)
    data = q.all()

    taxons = []
    if data:
        for d in data:
            taxon = dict()
            taxon['id_cor_hab_taxon'] = str(d[0])
            taxon['nom_complet'] = str(d[1])
            taxons.append(taxon)
        return taxons
    return None


@blueprint.route('/update_visit/<id_visit>', methods=['PATCH'])
@json_resp
@permissions.check_cruved_scope('U', True, module_code="SUIVI_HAB_STA")
def patch_visit(id_visit, info_role):
    '''
    Mettre à jour une visite
    '''
    data = dict(request.get_json())
    try:
        existingVisit = TVisitSHS.query.filter_by(
            id_base_visit=id_visit).first()
        if(existingVisit == None):
            raise ValueError('This visit does not exist')
    except ValueError:
        resp = jsonify({"error": 'This visit does not exist'})
        resp.status_code = 404
        return resp

    existingVisit = existingVisit.as_dict(recursif=True)
    dateIsUp = data['visit_date_min'] != existingVisit['visit_date_min']

    if dateIsUp:
        check_year_visit(data['id_base_site'], data['visit_date_min'][0:4])

    tab_releve_plots = []
    tab_observers = []
    tab_perturbations = []
    tab_plot_data = []

    if 'plots' in data:
        tab_releve_plots = data.pop('plots')
    if 'observers' in data:
        tab_observers = data.pop('observers')
    if 'perturbations' in data:
        tab_perturbations = data.pop('perturbations')

    visit = TVisitSHS(**data)

    for releve in tab_releve_plots:
        if 'plot_data' in releve:
            releve['excretes_presence'] = releve['plot_data']['excretes_presence']
            tab_plot_data = releve.pop('plot_data')
        releve_plot = TRelevePlot(**releve)
        for strat in tab_plot_data['strates_releve']:
            strat_item = CorRelevePlotStrat(**strat)
            releve_plot.cor_releve_strats.append(strat_item)
        for taxon in tab_plot_data['taxons_releve']:
            taxon_item = CorRelevePlotTaxon(**taxon)
            releve_plot.cor_releve_taxons.append(taxon_item)
        visit.cor_releve_plot.append(releve_plot)

    DB.session.query(CorTransectVisitPerturbation).filter_by(
        id_base_visit=id_visit).delete()
    for per in tab_perturbations:
        visit_per = CorTransectVisitPerturbation(**per)
        visit.cor_visit_perturbation.append(visit_per)
    observers = DB.session.query(User).filter(
        User.id_role.in_(tab_observers)
    ).all()
    for o in observers:
        visit.observers.append(o)
    mergeVisit = DB.session.merge(visit)

    DB.session.commit()

    return mergeVisit.as_dict(recursif=True)


@blueprint.route('/sites', methods=['GET'])
@json_resp
def get_all_sites():
    '''
    Retourne tous les sites qui n'ont pas de transects
    '''
    parameters = request.args

    q = DB.session.query(TBaseSites).outerjoin(
        (TTransect, TBaseSites.id_base_site == TTransect.id_base_site)
    ).filter(TTransect.id_base_site == None)

    if 'site_type' in parameters:
        q = q.filter(TBaseSites.id_nomenclature_type_site ==
                     parameters['site_type'])
    data = q.all()
    if 'id_base_site' in parameters:
        current_site = DB.session.query(TBaseSites).filter(
            TBaseSites.id_base_site == parameters['id_base_site']).first()
        if current_site:
            data.append(current_site)
    if data:
        return [d.as_dict() for d in data]
    return ('sites_not_found'), 404


@blueprint.route('/habitats/<id_list>', methods=['GET'])
@json_resp
def get_habitats(id_list):
    '''
    Récupère les habitats cor_list_habitat à partir de l'identifiant id_list de la table bib_lis_habitat
    '''
    q = DB.session.query(
        CorListHabitat.cd_hab,
        CorListHabitat.id_list,
        HabrefSHS.lb_hab_fr_complet
    ).join(
        HabrefSHS, CorListHabitat.cd_hab == HabrefSHS.cd_hab
    ).filter(
        CorListHabitat.id_list == id_list
    ).group_by(CorListHabitat.cd_hab,  HabrefSHS.lb_hab_fr_complet, CorListHabitat.id_list,)

    data = q.all()
    habitats = []

    if data:
        for d in data:
            habitat = dict()
            habitat['cd_hab'] = d[0]
            habitat['nom_complet'] = str(d[2])
            habitats.append(habitat)
        return habitats
    return None


@blueprint.route('/transect', methods=['POST'])
@json_resp
@permissions.check_cruved_scope('C', True, module_code="SUIVI_HAB_STA")
def post_transect(info_role):
    '''
    Poster un nouveau transect
    '''
    data = dict(request.get_json())
    tab_plots = []
    if 'cor_plots' in data:
        tab_plots = data.pop('cor_plots')
    site_data = {
        'id_nomenclature_type_site': blueprint.config['id_nomenclature_type_site'],
        'base_site_name': 'HAB-SHS-',
        'first_use_date': datetime.datetime.now(),
        'geom': func.ST_MakeLine(data.get('geom_start'), data.get('geom_end'))
    }
    site = TBaseSites(**site_data)
    DB.session.add(site)
    DB.session.commit()
    data['id_base_site'] = site.as_dict().get('id_base_site')
    transect = TTransect(**data)
    for plot in tab_plots:
        transect_plot = TPlot(**plot)
        transect.cor_plots.append(transect_plot)
    transect.as_dict(True)
    DB.session.add(transect)
    DB.session.commit()

    return site.as_dict(recursif=True)


@blueprint.route('/update_transect/<id_transect>', methods=['PATCH'])
@json_resp
@permissions.check_cruved_scope('U', True, module_code="SUIVI_HAB_STA")
def patch_transect(id_transect, info_role):
    '''
    Mettre à jour un transect
    '''
    data = dict(request.get_json())
    site_data = {
        'geom': func.ST_MakeLine(data.get('geom_start'), data.get('geom_end'))
    }
    q = DB.session.query(TBaseSites).filter_by(id_base_site=data.get('id_base_site')).update(site_data, synchronize_session='fetch')

    tab_plots = []
    if 'cor_plots' in data:
        tab_plots = data.pop('cor_plots')
    transect = TTransect(**data)
    for plot in tab_plots:
        transect_plot = TPlot(**plot)
        transect.cor_plots.append(transect_plot)
    transect.as_dict(True)
    DB.session.merge(transect)
    DB.session.commit()
    return transect.as_dict(recursif=True)


@blueprint.route('/user/cruved', methods=['GET'])
@permissions.check_cruved_scope('R', True)
@json_resp
def returnUserCruved(info_role):
    # récupérer le CRUVED complet de l'utilisateur courant
    user_cruved = get_or_fetch_user_cruved(
        session=session,
        id_role=info_role.id_role,
        module_code=blueprint.config['MODULE_CODE']
    )
    return user_cruved


@blueprint.route('/export_visit', methods=['GET'])
@permissions.check_cruved_scope('E', True)
def export_visit(info_role):
    '''
    Télécharge les données d'une visite (ou des visites )
    '''

    parameters = request.args
    export_format = parameters['export_format'] if 'export_format' in request.args else 'shapefile'

    file_name = datetime.datetime.now().strftime('%Y_%m_%d_%Hh%Mm%S')
    q = (DB.session.query(ExportVisits))

    if 'id_base_visit' in parameters:
        q = (DB.session.query(ExportVisits)
             .filter(ExportVisits.idbvisit == parameters['id_base_visit'])
             )
    elif 'id_releve_plot' in parameters:
        q = (DB.session.query(ExportVisits)
             .filter(ExportVisits.idreleve == parameters['id_releve_plot'])
             )
    elif 'id_base_site' in parameters:
        q = (DB.session.query(ExportVisits)
             .filter(ExportVisits.idbsite == parameters['id_base_site'])
             )
    elif 'organisme' in parameters:
        q = (DB.session.query(ExportVisits)
             .filter(ExportVisits.organisme == parameters['organisme'])
             )
    elif 'year' in parameters:
        q = (DB.session.query(ExportVisits)
             .filter(func.date_part('year', ExportVisits.visitdate) == parameters['year'])
             )
    elif 'cd_hab' in parameters:
        q = (DB.session.query(ExportVisits)
             .filter(ExportVisits.cd_hab == parameters['cd_hab'])
             )

    data = q.all()
    features = []

    # formate data
    cor_hab_taxon = []
    flag_cdhab = 0

    strates = []
    tab_header = []
    column_name = get_base_column_name()
    column_name_pro = get_pro_column_name()
    mapping_columns = get_mapping_columns()

    strates_list = get_stratelist_plot()

    tab_visit = []

    for d in data:
        visit = d.as_dict()

        # Get list hab/taxon
        cd_hab = visit['cd_hab']
        if flag_cdhab !=  cd_hab:
            cor_hab_taxon = get_taxonlist_by_cdhab(cd_hab)
            flag_cdhab = cd_hab

        # remove geom Type
        geom_wkt = to_shape(d.geom)
        geom_array = array(geom_wkt)
        if export_format == 'geojson':
            visit['geom_wkt'] = geom_wkt
        elif export_format == 'csv' or export_format == 'shapefile':
            visit['geom'] = d.geom
            if geom_wkt.type.lower() == 'linestring':
                visit['geom'] = str(geom_array[0]) + " / " + str(geom_array[1])


        # remove html tag
        visit['lbhab'] = striphtml( visit['lbhab'])

        # Translate label column
        visit = dict((mapping_columns[key], value) for (key, value) in visit.items() if key in mapping_columns)

        # pivot strate
        if visit['covstrate']:
            for strate, cover in visit['covstrate'].items():
                visit[strate] = " % " + str(cover)
        if 'covstrate' in visit:
            visit.pop('covstrate')

        # pivot taxons
        if visit['covtaxons']:
            for taxon, cover in visit['covtaxons'].items():
                visit[taxon] = " % " + str(cover)
        if 'covtaxons' in visit:
            visit.pop('covtaxons')

        tab_visit.append(visit)


    if export_format == 'geojson':

        for d in tab_visit:
            feature = mapping(d['geom_wkt'])
            d.pop('geom_wkt', None)
            properties = d
            features.append(feature)
            features.append(properties)
        result = FeatureCollection(features)

        return to_json_resp(
            result,
            as_file=True,
            filename=file_name,
            indent=4
        )

    elif export_format == 'csv':

        tab_header = column_name + [clean_string(x) for x in strates_list] + [clean_string(x) for x in cor_hab_taxon] + column_name_pro

        return to_csv_resp(
            file_name,
            tab_visit,
            tab_header,
            ';'
        )

    else:

        dir_path = str(ROOT_DIR / 'backend/static/shapefiles')

        FionaShapeService.create_shapes_struct(
            db_cols=ExportVisits.__mapper__.c,
            srid=2154,
            dir_path=dir_path,
            file_name=file_name,
        )

        for row in data:
            FionaShapeService.create_feature(row.as_dict(), row.geom)

        FionaShapeService.save_and_zip_shapefiles()

        return send_from_directory(
            dir_path,
            file_name+'.zip',
            as_attachment=True
        )
