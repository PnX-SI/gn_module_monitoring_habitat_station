import datetime

from flask import Blueprint, request, send_from_directory, g
from geojson import FeatureCollection
from sqlalchemy.sql.expression import func
from sqlalchemy import and_, distinct, func
from geoalchemy2.shape import to_shape
from numpy import array
from shapely.geometry import *
from werkzeug.exceptions import BadRequest, NotFound

from apptax.taxonomie.models import Taxref
from pypn_habref_api.models import BibListHabitat, cor_list_habitat, Habref
from pypnnomenclature.models import TNomenclatures
from pypnusershub.db.models import Organisme, User
from utils_flask_sqla.response import json_resp, to_csv_resp, to_json_resp
from utils_flask_sqla_geo.utilsgeometry import FionaShapeService

from geonature.core.gn_permissions import decorators as permissions
from geonature.core.gn_permissions.tools import get_scopes_by_action
from geonature.core.gn_meta.models import TDatasets
from geonature.core.gn_monitoring.models import (
    corVisitObserver,
    corSiteArea,
    TBaseVisits,
    TBaseSites,
)
from geonature.core.gn_commons.models import TModules
from ref_geo.models import LAreas
from geonature.utils.env import db, DB, ROOT_DIR
from gn_conservation_backend_shared.webservices.debug import fprint

from gn_module_monitoring_habitat_station import MODULE_CODE, METADATA_CODE
from .repositories import (
    check_year_visit,
    get_id_type_site,
    get_taxons_by_cd_hab,
    get_stratelist_plot,
    clean_string,
    strip_html,
    get_base_column_name,
    get_pro_column_name,
    get_mapping_columns,
)
from .models import (
    TTransect,
    TPlot,
    TRelevePlot,
    Visit,
    CorTransectVisitPerturbation,
    CorRelevePlotStrat,
    CorRelevePlotTaxon,
    CorHabTaxon,
    ExportVisits,
)


blueprint = Blueprint("pr_monitoring_habitat_station", __name__)


@blueprint.route("/users/current/cruved", methods=["GET"])
@permissions.check_cruved_scope("R", get_scope=True, module_code=MODULE_CODE)
@json_resp
def get_user_cruved(scope):
    # récupérer le CRUVED complet de l'utilisateur courant
    user_cruved = get_scopes_by_action(
        id_role=g.current_user.id_role, module_code=blueprint.config["MODULE_CODE"]
    )
    return user_cruved


@blueprint.route("/sites", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_sites():
    """
    Retourne tous les sites qui n'ont pas de transects
    """
    parameters = request.args

    q = (
        DB.session.query(TBaseSites)
        .outerjoin((TTransect, TBaseSites.id_base_site == TTransect.id_base_site))
        .filter(
            TBaseSites.id_nomenclature_type_site
            == get_id_type_site(blueprint.config["site_type_code"])
        )
        .filter(TTransect.id_base_site == None)
    )

    data = q.all()
    if "id_base_site" in parameters:
        current_site = (
            DB.session.query(TBaseSites)
            .filter(TBaseSites.id_base_site == parameters["id_base_site"])
            .first()
        )
        if current_site:
            data.append(current_site)
    if data:
        return [d.as_dict() for d in data]
    return ("sites_not_found"), 404


@blueprint.route("/transects", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_transects():
    """
    Retourne tous les transects
    """
    parameters = request.args

    q = (
        DB.session.query(
            TTransect,
            func.max(TBaseVisits.visit_date_min),
            Habref.lb_hab_fr,
            func.count(distinct(TBaseVisits.id_base_visit)),
            func.string_agg(distinct(Organisme.nom_organisme), ", "),
        )
        .outerjoin(TBaseVisits, TBaseVisits.id_base_site == TTransect.id_base_site)
        .outerjoin(Habref, TTransect.cd_hab == Habref.cd_hab)
        .outerjoin(corVisitObserver, corVisitObserver.c.id_base_visit == TBaseVisits.id_base_visit)
        .outerjoin(User, User.id_role == corVisitObserver.c.id_role)
        .outerjoin(Organisme, Organisme.id_organisme == User.id_organisme)
        .group_by(TTransect, Habref.lb_hab_fr)
    )

    if "filterHab" in parameters:
        q = q.filter(TTransect.cd_hab == parameters["filterHab"])

    if "date_low" in parameters and "date_up" in parameters:
        q_date = (
            DB.session.query(
                TTransect.id_base_site,
                func.max(TBaseVisits.visit_date_min),
            )
            .outerjoin(TBaseVisits, TBaseVisits.id_base_site == TTransect.id_base_site)
            .group_by(TTransect.id_base_site)
            .all()
        )
        q = q.filter(
            and_(
                TBaseVisits.visit_date_min <= parameters["date_up"],
                TBaseVisits.visit_date_min >= parameters["date_low"],
            )
        )

    page = request.args.get("page", 1, type=int)
    items_per_page = blueprint.config["items_per_page"]
    pagination_serverside = blueprint.config["pagination_serverside"]
    pagination = q.paginate(page, items_per_page, False)
    total_items = pagination.total
    if pagination_serverside:
        data = pagination.items
    else:
        data = q.all()

    pageInfo = {
        "totalItems": total_items,
        "itemsPerPage": items_per_page,
    }
    if data:
        features = []
        for d in data:
            feature = d[0].get_geofeature(fields=["t_base_site"])
            id_site = feature["properties"]["id_base_site"]
            base_site_code = feature["properties"]["t_base_site"]["base_site_code"]
            base_site_description = (
                feature["properties"]["t_base_site"]["base_site_description"]
                or "Aucune description"
            )
            base_site_name = feature["properties"]["t_base_site"]["base_site_name"]
            if feature["properties"]["t_base_site"]:
                del feature["properties"]["t_base_site"]

            if "year" in parameters:
                for dy in q_date:
                    #  récupérer la bonne date max du site si on filtre sur année
                    if id_site == dy[0]:
                        feature["properties"]["date_max"] = str(d[1])
            else:
                feature["properties"]["date_max"] = str(d[1])
                if d[1] == None:
                    feature["properties"]["date_max"] = "Aucune visite"

            feature["properties"]["nom_habitat"] = str(d[2])
            feature["properties"]["nb_visit"] = str(d[3])

            if d[4] == None:
                feature["properties"]["organisme"] = "Aucun"

            feature["properties"]["organisme"] = "Aucun"
            feature["properties"]["base_site_code"] = base_site_code
            feature["properties"]["base_site_description"] = base_site_description
            feature["properties"]["base_site_name"] = base_site_name
            features.append(feature)

        return [pageInfo, FeatureCollection(features)]
    return None


def load_transect(id_site):
    query = (
        DB.session.query(
            TTransect,
            TNomenclatures,
            func.string_agg(distinct(LAreas.area_name), ", "),
            func.string_agg(distinct(Organisme.nom_organisme), ", "),
            Habref.lb_hab_fr,
        )
        .filter_by(id_base_site=id_site)
        .outerjoin(TBaseVisits, TBaseVisits.id_base_site == TTransect.id_base_site)
        .outerjoin(
            TNomenclatures,
            TTransect.id_nomenclature_plot_position == TNomenclatures.id_nomenclature,
        )
        .outerjoin(Habref, TTransect.cd_hab == Habref.cd_hab)
        .outerjoin(corVisitObserver, corVisitObserver.c.id_base_visit == TBaseVisits.id_base_visit)
        .outerjoin(User, User.id_role == corVisitObserver.c.id_role)
        .outerjoin(Organisme, Organisme.id_organisme == User.id_organisme)
        .outerjoin(corSiteArea, corSiteArea.c.id_base_site == TTransect.id_base_site)
        .outerjoin(
            LAreas,
            and_(
                LAreas.id_area == corSiteArea.c.id_area,
                LAreas.id_type
                == func.ref_geo.get_id_area_type(blueprint.config["municipality_type_code"]),
            ),
        )
        .group_by(TTransect.id_transect, TNomenclatures.id_nomenclature, Habref.lb_hab_fr)
    )
    data = query.first()

    if data:
        transect = data[0].get_geofeature(fields=["t_base_site", "cor_plots"])
        plot_position = data[1].as_dict()
        transect["properties"]["plot_position"] = plot_position
        if data[2]:
            transect["properties"]["nom_commune"] = str(data[2])
        if data[3]:
            transect["properties"]["observers"] = str(data[3])
        if data[4]:
            transect["properties"]["nom_habitat"] = str(data[4])
        base_site_code = transect["properties"]["t_base_site"]["base_site_code"]
        base_site_description = transect["properties"]["t_base_site"]["base_site_description"]
        base_site_name = transect["properties"]["t_base_site"]["base_site_name"]
        if transect["properties"]["t_base_site"]:
            del transect["properties"]["t_base_site"]
        transect["properties"]["base_site_code"] = base_site_code
        transect["properties"]["base_site_description"] = base_site_description
        transect["properties"]["base_site_name"] = base_site_name
        return transect
    return None


@blueprint.route("/transects/<id_site>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_one_transect(id_site):
    """
    Retourne un transect à l'aide de son id_site
    """
    return load_transect(id_site)


@blueprint.route("/transects", methods=["POST"])
@permissions.check_cruved_scope("C", get_scope=True, module_code=MODULE_CODE)
@json_resp
def add_transect(scope):
    """
    Poster un nouveau transect
    """
    data = dict(request.get_json())
    tab_plots = []
    if "cor_plots" in data:
        tab_plots = data.pop("cor_plots")
    site_data = {
        "id_nomenclature_type_site": get_id_type_site(blueprint.config["site_type_code"]),
        "base_site_name": f"HAB - {MODULE_CODE} - {data['transect_label']}",
        "base_site_description": data.pop("base_site_description", None),
        "first_use_date": datetime.datetime.now(),
        "id_digitiser": g.current_user.id_role,
        "geom": func.ST_MakeLine(data.get("geom_start"), data.get("geom_end")),
    }
    site = TBaseSites(**site_data)
    DB.session.add(site)
    DB.session.commit()

    data["id_base_site"] = site.as_dict().get("id_base_site")
    site.base_site_code = f"HAB-{MODULE_CODE}-{data['id_base_site']}"
    DB.session.merge(site)
    DB.session.commit()

    transect = TTransect(**data)
    for plot in tab_plots:
        transect_plot = TPlot(**plot)
        transect.cor_plots.append(transect_plot)
    DB.session.add(transect)
    DB.session.commit()

    return load_transect(data.get("id_base_site"))


@blueprint.route("/transects/<id_transect>", methods=["PATCH"])
@permissions.check_cruved_scope("U", get_scope=True, module_code=MODULE_CODE)
@json_resp
def update_transect(id_transect, scope):
    """
    Mettre à jour un transect
    """
    data = dict(request.get_json())

    # Update base site table
    site_data = {
        "base_site_description": data.pop("base_site_description", None),
        "geom": func.ST_MakeLine(data.get("geom_start"), data.get("geom_end"))
    }
    (
        DB.session.query(TBaseSites)
        .filter_by(id_base_site=data.get("id_base_site"))
        .update(site_data, synchronize_session="fetch")
    )

    plots = []
    if "cor_plots" in data:
       plots = data.pop("cor_plots")

    transect = TTransect(**data)
    for plot in plots:
        transect_plot = TPlot(**plot)
        transect.cor_plots.append(transect_plot)
    DB.session.merge(transect)
    DB.session.commit()

    return load_transect(data.get("id_base_site"))


@blueprint.route("/sites/<id_site>/visits", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_visits(id_site):
    """
    Retourne les visites d'un site par son id
    """
    query = (
        DB.session.query(Visit)
        .filter_by(id_base_site=id_site)
        .order_by(Visit.visit_date_min.desc())
    )
    pagination = query.paginate()
    total_items = pagination.total
    data = query.all()

    pageInfo = {
        "totalItems": total_items,
        "itemsPerPage": blueprint.config["items_per_page"],
    }
    if data:
        return [
            pageInfo,
            [
                d.as_dict(fields=["cor_releve_plot", "cor_visit_perturbation", "observers"])
                for d in data
            ],
        ]
    return None


@blueprint.route("/visits/<id_visit>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_one_visit(id_visit):
    """
    Retourne les visites d'un site par son id
    """
    data = DB.session.query(Visit).filter_by(id_base_visit=id_visit).first()
    if data:
        visit = data.as_dict(
            fields=[
                "cor_releve_plot.cor_releve_taxons",
                "cor_releve_plot.cor_releve_taxons.sciname.nom_complet_html",
                "cor_releve_plot.cor_releve_strats",
                "cor_visit_perturbation.t_nomenclature",
                "observers",
            ]
        )

        for releve in visit["cor_releve_plot"]:
            plot_data = dict()
            if "excretes_presence" in releve:
                plot_data["excretes_presence"] = releve["excretes_presence"]
                del releve["excretes_presence"]
            if "cor_releve_taxons" in releve:
                plot_data["taxons_releve"] = releve["cor_releve_taxons"]
                del releve["cor_releve_taxons"]
            if "cor_releve_strats" in releve:
                plot_data["strates_releve"] = releve["cor_releve_strats"]
                del releve["cor_releve_strats"]
            releve["plot_data"] = plot_data
        return visit
    return None


@blueprint.route("/visits", methods=["POST"])
@permissions.check_cruved_scope("C", get_scope=True, module_code=MODULE_CODE)
@json_resp
def add_visit(scope):
    """
    Poster une nouvelle visite
    """
    data = dict(request.get_json())

    check_year_visit(data["id_base_site"], data["visit_date_min"])

    releve_plots = []
    if "plots" in data:
        releve_plots = data.pop("plots")

    observers_ids = []
    if "observers" in data:
        observers = data.pop("observers")

    perturbations = []
    if "perturbations" in data:
        if data["perturbations"] != None:
            perturbations = data.pop("perturbations")
        else:
            data.pop("perturbations")
            del data["perturbations"]

    if "id_dataset" not in data or data["id_dataset"] == "":
        dataset_code = METADATA_CODE
        Dataset = (
            DB.session.query(TDatasets).filter(TDatasets.dataset_shortname == dataset_code).first()
        )
        if Dataset:
            data["id_dataset"] = Dataset.id_dataset
        else:
            raise BadRequest(f"Module dataset shortname '{dataset_code}' was not found !")

    if "id_module" not in data or data["id_module"] == "":
        data["id_module"] = (
            db.session.query(TModules.id_module)
            .filter(TModules.module_code == MODULE_CODE)
            .scalar()
        )

    if "id_digitiser" not in data or data["id_digitiser"] == "":
        data["id_digitiser"] = g.current_user.id_role

    visit = Visit(**data)

    for per in perturbations:
        visit_per = CorTransectVisitPerturbation(**per)
        visit.cor_visit_perturbation.append(visit_per)

    plot_data = []
    for releve in releve_plots:
        if "plot_data" in releve:
            releve["excretes_presence"] = releve["plot_data"]["excretes_presence"]
            plot_data = releve.pop("plot_data")

        releve_plot = TRelevePlot(**releve)
        for strat in plot_data["strates_releve"]:
            if strat["cover_pourcentage"] != None and strat["cover_pourcentage"] != 0:
                strat_item = CorRelevePlotStrat(**strat)
                releve_plot.cor_releve_strats.append(strat_item)
        for taxon in plot_data["taxons_releve"]:
            if taxon["cover_pourcentage"] != None and taxon["cover_pourcentage"] != 0:
                taxon_item = CorRelevePlotTaxon(**taxon)
                releve_plot.cor_releve_taxons.append(taxon_item)

        visit.cor_releve_plot.append(releve_plot)

    observers = DB.session.query(User).filter(User.id_role.in_(observers_ids)).all()
    for observer in observers:
        visit.observers.append(observer)

    DB.session.add(visit)
    DB.session.commit()
    return visit.as_dict()


@blueprint.route("/visits/<id_visit>", methods=["PATCH"])
@permissions.check_cruved_scope("U", module_code=MODULE_CODE)
@json_resp
def update_visit(id_visit):
    """
    Mettre à jour une visite
    """
    data = dict(request.get_json())

    existingVisit = Visit.query.filter_by(id_base_visit=id_visit).first()
    if existingVisit == None:
        raise NotFound(f"Visit {id_visit} does not exist")

    existingVisit = existingVisit.as_dict()

    dateIsUp = data["visit_date_min"] != existingVisit["visit_date_min"]
    if dateIsUp:
        check_year_visit(data["id_base_site"], data["visit_date_min"], id_base_visit=id_visit)

    releve_plots = []
    if "plots" in data:
        releve_plots = data.pop("plots")

    observers_ids = []
    if "observers" in data:
        observers_ids = data.pop("observers")

    perturbations = []
    if "perturbations" in data:
        perturbations = data.pop("perturbations")

    visit = Visit(**data)

    fprint(releve_plots)
    plot_data = []
    for releve in releve_plots:
        if "plot_data" in releve:
            releve["excretes_presence"] = releve["plot_data"]["excretes_presence"]
            plot_data = releve.pop("plot_data")
        print("-"*78)
        fprint(releve)
        releve_plot = TRelevePlot(**releve)
        for strat in plot_data["strates_releve"]:
            if strat["cover_pourcentage"] != None and strat["cover_pourcentage"] != 0:
                strat_item = CorRelevePlotStrat(**strat)
                releve_plot.cor_releve_strats.append(strat_item)
            elif "id_releve_plot_strat" in strat and (strat["cover_pourcentage"] == None or strat["cover_pourcentage"] == 0):
                DB.session.query(CorRelevePlotStrat).filter_by(
                    id_releve_plot_strat=strat["id_releve_plot_strat"]
                ).delete()
        for taxon in plot_data["taxons_releve"]:
            if "sciname" in taxon:
                del taxon["sciname"]
            if taxon["cover_pourcentage"] != None and taxon["cover_pourcentage"] != 0:
                taxon_item = CorRelevePlotTaxon(**taxon)
                releve_plot.cor_releve_taxons.append(taxon_item)
            elif "id_cor_releve_plot_taxon" in taxon and (taxon["cover_pourcentage"] == None or taxon["cover_pourcentage"] == 0):
                DB.session.query(CorRelevePlotTaxon).filter_by(
                    id_cor_releve_plot_taxon=taxon["id_cor_releve_plot_taxon"]
                ).delete()
        visit.cor_releve_plot.append(releve_plot)

    DB.session.query(CorTransectVisitPerturbation).filter_by(id_base_visit=id_visit).delete()
    for perturbation in perturbations:
        visit_perturbation = CorTransectVisitPerturbation(**perturbation)
        visit.cor_visit_perturbation.append(visit_perturbation)

    observers = DB.session.query(User).filter(User.id_role.in_(observers_ids)).all()
    for observer in observers:
        visit.observers.append(observer)

    print(visit)
    mergeVisit = DB.session.merge(visit)
    DB.session.commit()

    return mergeVisit.as_dict()


@blueprint.route("/habitats", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_habitats():
    """
    Récupère les habitats utilisé dans ce module.
    """
    query = (
        DB.session.query(cor_list_habitat.c.cd_hab, Habref.lb_hab_fr)
        .join(Habref, cor_list_habitat.c.cd_hab == Habref.cd_hab)
        .join(BibListHabitat, BibListHabitat.id_list == cor_list_habitat.c.id_list)
        .filter(BibListHabitat.list_name == blueprint.config["habitat_list_name"])
        .group_by(
            cor_list_habitat.c.cd_hab,
            Habref.lb_hab_fr,
        )
    )
    data = query.all()

    if data:
        habitats = []
        for d in data:
            habitats.append(
                {
                    "cd_hab": d[0],
                    "nom_complet": str(d[1]),
                }
            )
        return habitats
    return None


@blueprint.route("/habitats/<cd_hab>/taxons", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_taxa_by_habitats(cd_hab):
    """
    Retourne tous les taxons d'un habitat.
    """
    query = (
        DB.session.query(CorHabTaxon.id_cor_hab_taxon, CorHabTaxon.cd_nom, Taxref.nom_complet_html)
        .join(Taxref, CorHabTaxon.cd_nom == Taxref.cd_nom)
        .group_by(CorHabTaxon.id_habitat, CorHabTaxon.id_cor_hab_taxon, Taxref.nom_complet_html)
        .filter(CorHabTaxon.id_habitat == cd_hab)
    )
    data = query.all()

    if data:
        taxons = []
        for d in data:
            taxons.append(
                {
                    "id_cor_hab_taxon": str(d[0]),
                    "cd_nom": str(d[1]),
                    "nom_complet": str(d[2]),
                }
            )
        return taxons
    return None


@blueprint.route("/visits/export", methods=["GET"])
@permissions.check_cruved_scope("E", module_code=MODULE_CODE)
def export_visits():
    """
    Télécharge les données d'une visite (ou des visites )
    """

    parameters = request.args
    export_format = parameters["export_format"] if "export_format" in request.args else "shapefile"

    file_name = datetime.datetime.now().strftime("%Y_%m_%d_%Hh%Mm%S")
    q = DB.session.query(ExportVisits)

    if "id_base_visit" in parameters:
        q = DB.session.query(ExportVisits).filter(
            ExportVisits.idbvisit == parameters["id_base_visit"]
        )
    elif "id_releve_plot" in parameters:
        q = DB.session.query(ExportVisits).filter(
            ExportVisits.idreleve == parameters["id_releve_plot"]
        )
    elif "id_base_site" in parameters:
        q = DB.session.query(ExportVisits).filter(
            ExportVisits.idbsite == parameters["id_base_site"]
        )
    elif "organisme" in parameters:
        q = DB.session.query(ExportVisits).filter(ExportVisits.organisme == parameters["organisme"])
    elif "year" in parameters:
        q = DB.session.query(ExportVisits).filter(
            func.date_part("year", ExportVisits.visitdate) == parameters["year"]
        )
    elif "cd_hab" in parameters:
        q = DB.session.query(ExportVisits).filter(ExportVisits.cd_hab == parameters["cd_hab"])

    data = q.all()
    features = []

    # formate data
    cor_hab_taxon = []
    flag_cdhab = 0

    tab_header = []
    column_name = get_base_column_name()
    column_name_pro = get_pro_column_name()
    mapping_columns = get_mapping_columns()
    strates_list = get_stratelist_plot()

    tab_visit = []

    for d in data:
        visit = d.as_dict()

        # Get list hab/taxon
        cd_hab = visit["cd_hab"]
        if flag_cdhab != cd_hab:
            cor_hab_taxon = get_taxons_by_cd_hab(cd_hab)
            flag_cdhab = cd_hab

        # remove geom Type
        geom_wkt = to_shape(d.geom)
        geom_array = array(geom_wkt)
        visit["geom_wkt"] = geom_wkt
        if export_format == "csv" or export_format == "shapefile":
            visit["geom"] = d.geom
            if geom_wkt.type.lower() == "linestring":
                visit["geom"] = str(geom_array[0]) + " / " + str(geom_array[1])

        # remove html tag
        visit["lbhab"] = strip_html(visit["lbhab"])

        # Translate label column
        visit = dict(
            (mapping_columns[key], value)
            for (key, value) in visit.items()
            if key in mapping_columns
        )

        # pivot strate
        if visit["covstrate"]:
            for strate, cover in visit["covstrate"].items():
                visit[strate] = " % " + str(cover)
        if "covstrate" in visit:
            visit.pop("covstrate")

        # pivot taxons
        if visit["covtaxons"]:
            for taxon, cover in visit["covtaxons"].items():
                visit[taxon] = " % " + str(cover)
        if "covtaxons" in visit:
            visit.pop("covtaxons")

        tab_visit.append(visit)

    if export_format == "geojson":

        for d in tab_visit:
            feature = mapping(d["geom_wkt"])
            d.pop("geom_wkt", None)
            properties = d
            features.append(feature)
            features.append(properties)
        result = FeatureCollection(features)

        return to_json_resp(result, as_file=True, filename=file_name, indent=4)

    elif export_format == "csv":

        tab_header = (
            column_name
            + [clean_string(x) for x in strates_list]
            + [clean_string(x) for x in cor_hab_taxon]
            + column_name_pro
        )

        return to_csv_resp(file_name, tab_visit, tab_header, ";")

    else:

        dir_path = str(ROOT_DIR / "backend/static/shapefiles")

        FionaShapeService.create_shapes_struct(
            db_cols=ExportVisits.__mapper__.c,
            srid=4326,
            dir_path=dir_path,
            file_name=file_name,
        )

        for row in data:
            FionaShapeService.create_feature(row.as_dict(), row.geom)

        FionaShapeService.save_and_zip_shapefiles()

        return send_from_directory(dir_path, file_name + ".zip", as_attachment=True)
