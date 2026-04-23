import datetime
import os

from flask import request, g, send_from_directory
from sqlalchemy import and_, distinct, func, delete, select
from werkzeug.exceptions import NotFound, BadRequest
from geoalchemy2.shape import to_shape
from geojson import FeatureCollection

from geonature.utils.env import DB, ROOT_DIR
from geonature.core.gn_permissions import decorators as permissions
from geonature.core.gn_monitoring.models import (
    corVisitObserver,
    TBaseVisits,
)
from geonature.core.gn_meta.models import TDatasets
from geonature.core.gn_commons.models import TModules
from pypnusershub.db.models import User
from utils_flask_sqla.response import json_resp, to_csv_resp, to_json_resp
from utils_flask_sqla_geo.utilsgeometry import FionaShapeService

from ..blueprint import blueprint
from ..models import (
    TRelevePlot,
    Visit,
    CorTransectVisitPerturbation,
    CorRelevePlotStrat,
    CorRelevePlotTaxon,
    ExportVisits,
)
from ..repositories import (
    check_year_visit,
    get_taxons_by_cd_hab,
    clean_string,
    strip_html,
    get_base_column_name,
    get_pro_column_name,
    get_mapping_columns,
    get_stratelist_plot,
)
from gn_module_monitoring_habitat_station import MODULE_CODE, METADATA_CODE


@blueprint.route("/sites/<id_site>/visits", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_visits(id_site):
    """
    Retourne les visites d'un site par son id
    """
    query = select(Visit).filter_by(id_base_site=id_site).order_by(Visit.visit_date_min.desc())

    page = request.args.get("page", 0, type=int)
    total_items = DB.session.scalar(select(func.count("*")).select_from(query))
    items_per_page = blueprint.config["items_per_page"]
    # we can't use DB.paginate() here because it use a .scalars() which return only the first item of the select
    data = DB.session.scalars(query).unique().all()

    pageInfo = {
        "totalItems": total_items,
        "itemsPerPage": items_per_page,
    }

    fields = ["cor_releve_plot", "cor_visit_perturbation", "observers"]
    if data:
        return [pageInfo, [d.as_dict(fields=fields) for d in data]]
    return None


@blueprint.route("/visits/<id_visit>", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_one_visit(id_visit):
    """
    Retourne les visites d'un site par son id
    """
    data = DB.session.scalars(select(Visit).filter_by(id_base_visit=id_visit)).first()
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
        observers_ids = data.pop("observers")

    perturbations = []
    if "perturbations" in data:
        if data["perturbations"] != None:
            perturbations = data.pop("perturbations")
        else:
            data.pop("perturbations")
            del data["perturbations"]

    if "id_dataset" not in data or data["id_dataset"] == "":
        dataset_code = METADATA_CODE
        Dataset = DB.session.scalars(
            select(TDatasets).where(TDatasets.dataset_shortname == dataset_code)
        ).first()
        if Dataset:
            data["id_dataset"] = Dataset.id_dataset
        else:
            raise BadRequest(f"Module dataset shortname '{dataset_code}' was not found !")

    if "id_module" not in data or data["id_module"] == "":
        data["id_module"] = DB.session.execute(
            select(TModules.id_module).where(TModules.module_code == MODULE_CODE)
        ).scalar_one()

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

    observers = (
        DB.session.scalars(select(User).where(User.id_role.in_(observers_ids))).unique().all()
    )
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

    existingVisit = DB.session.get(Visit, id_visit)
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
            elif "id_releve_plot_strat" in strat and (
                strat["cover_pourcentage"] == None or strat["cover_pourcentage"] == 0
            ):
                delete_cor_releve_plot_strat = delete(CorRelevePlotStrat).filter_by(
                    id_releve_plot_strat=strat["id_releve_plot_strat"]
                )
                DB.session.execute(delete_cor_releve_plot_strat)
        for taxon in plot_data["taxons_releve"]:
            if "sciname" in taxon:
                del taxon["sciname"]
            if taxon["cover_pourcentage"] != None and taxon["cover_pourcentage"] != 0:
                taxon_item = CorRelevePlotTaxon(**taxon)
                releve_plot.cor_releve_taxons.append(taxon_item)
            elif "id_cor_releve_plot_taxon" in taxon and (
                taxon["cover_pourcentage"] == None or taxon["cover_pourcentage"] == 0
            ):
                delete_cor_releve_plot_taxon = delete(CorRelevePlotTaxon).filter_by(
                    id_cor_releve_plot_taxon=taxon["id_cor_releve_plot_taxon"]
                )
                DB.session.execute(delete_cor_releve_plot_taxon)
        visit.cor_releve_plot.append(releve_plot)

    delete_cor_transect_visit_perturbation = delete(CorTransectVisitPerturbation).filter_by(
        id_base_visit=id_visit
    )
    DB.session.execute(delete_cor_transect_visit_perturbation)
    for perturbation in perturbations:
        visit_perturbation = CorTransectVisitPerturbation(**perturbation)
        visit.cor_visit_perturbation.append(visit_perturbation)

    observers = (
        DB.session.scalars(select(User).where(User.id_role.in_(observers_ids))).unique().all()
    )
    for observer in observers:
        visit.observers.append(observer)

    mergeVisit = DB.session.merge(visit)
    DB.session.commit()

    return mergeVisit.as_dict()


@blueprint.route("/visits/export", methods=["GET"])
@permissions.check_cruved_scope("E", module_code=MODULE_CODE)
def export_visits():
    """
    Télécharge les données d'une visite (ou des visites)
    """

    parameters = request.args

    export_format = parameters["export_format"] if "export_format" in request.args else "shapefile"

    # Build query and get data from db
    query = select(ExportVisits)

    if "id_base_site" in parameters:
        query = query.where(ExportVisits.idbsite == parameters["id_base_site"])
    elif "id_base_visit" in parameters:
        query = query.where(ExportVisits.idbvisit == parameters["id_base_visit"])
    elif "id_releve_plot" in parameters:
        query = query.where(ExportVisits.idreleve == parameters["id_releve_plot"])
    elif "year" in parameters:
        query = query.where(func.date_part("year", ExportVisits.visitdate) == parameters["year"])
    elif "cd_hab" in parameters:
        query = query.where(ExportVisits.cd_hab == parameters["cd_hab"])

    data = DB.session.scalars(query).all()

    # Format data
    cor_hab_taxon = []
    flag_cdhab = 0
    mapping_columns = get_mapping_columns()
    output_items = []
    for d in data:
        visit = d.as_dict()

        # Get list hab/taxon
        cd_hab = visit["cd_hab"]
        if flag_cdhab != cd_hab:
            cor_hab_taxon = get_taxons_by_cd_hab(cd_hab)
            flag_cdhab = cd_hab

        # Geom
        if export_format == "csv":
            shape_geom = to_shape(d.geom)
            visit["geom"] = shape_geom

        # Remove HTML tags
        visit["lbhab"] = strip_html(visit["lbhab"])

        # Translate label column
        visit = dict(
            (mapping_columns[key], value)
            for (key, value) in visit.items()
            if key in mapping_columns
        )

        # Pivot some values for CSV
        if export_format == "csv":
            # Pivot strate
            if visit["covstrate"]:
                for strate, cover in visit["covstrate"].items():
                    visit[clean_string(strate).lower()] = cover
                visit.pop("covstrate")

            # Pivot taxons
            if visit["covtaxons"]:
                for taxon, cover in visit["covtaxons"].items():
                    visit[clean_string(taxon)] = cover
                visit.pop("covtaxons")

        # Replace booleans values true/false by 1/0
        visit = {k: int(v) if isinstance(v, bool) else v for k, v in visit.items()}

        output_items.append(visit)

    # Return data
    file_name = datetime.datetime.now().strftime("%Y_%m_%d_%Hh%Mm%S")

    if export_format == "csv":
        column_name = get_base_column_name()
        column_name_pro = get_pro_column_name()
        strates_list = get_stratelist_plot()

        headers = (
            column_name
            + [clean_string(x).lower() for x in strates_list]
            + [clean_string(x) for x in cor_hab_taxon]
            + column_name_pro
        )
        return to_csv_resp(file_name, output_items, headers, ";")
    elif export_format == "geojson":
        features = []
        for visit in data:
            feature = visit.as_geofeature("geom", "idbsite", False)
            features.append(feature)
        geojson = FeatureCollection(features)
        return to_json_resp(
            geojson, as_file=True, filename=file_name, indent=4, extension="geojson"
        )
    else:
        dir_path = str(ROOT_DIR / "backend/static/shapefiles")
        if not os.path.exists(dir_path):
            os.mkdir(dir_path)
        FionaShapeService.create_shapes_struct(
            db_cols=ExportVisits.__mapper__.c,
            srid=4326,
            dir_path=dir_path,
            file_name=file_name,
        )

        for visit in data:
            FionaShapeService.create_feature(visit.as_dict(), visit.geom)

        FionaShapeService.save_and_zip_shapefiles()

        return send_from_directory(dir_path, file_name + ".zip", as_attachment=True)
    