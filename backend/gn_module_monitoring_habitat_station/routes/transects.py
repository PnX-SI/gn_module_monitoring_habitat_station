from flask import request, g
from geojson import FeatureCollection
from sqlalchemy import and_, distinct, func, update, select
from werkzeug.exceptions import NotFound

from geonature.utils.env import DB
from geonature.core.gn_permissions import decorators as permissions
from geonature.core.gn_monitoring.models import (
    corVisitObserver,
    corSiteArea,
    TBaseVisits,
    TBaseSites,
)
from ref_geo.models import LAreas
from pypn_habref_api.models import Habref
from pypnnomenclature.models import TNomenclatures
from pypnusershub.db.models import Organisme, User
from utils_flask_sqla.response import json_resp

from ..blueprint import blueprint
from ..models import TTransect, TPlot
from ..repositories import get_id_type_site
from gn_module_monitoring_habitat_station import MODULE_CODE



def load_transect(id_site):
    data = DB.session.execute(
        select(
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
    ).first()

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


@blueprint.route("/transects", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_transects():
    """
    Retourne tous les transects
    """
    parameters = request.args

    q = (
        select(
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
        q = q.where(TTransect.cd_hab == parameters["filterHab"])

    if "date_low" in parameters and "date_up" in parameters:
        q_date = (
            select(
                TTransect.id_base_site,
                func.max(TBaseVisits.visit_date_min),
            )
            .outerjoin(TBaseVisits, TBaseVisits.id_base_site == TTransect.id_base_site)
            .group_by(TTransect.id_base_site)
        )
        q = q.where(
            and_(
                TBaseVisits.visit_date_min <= parameters["date_up"],
                TBaseVisits.visit_date_min >= parameters["date_low"],
            )
        )

    page = request.args.get("page", 1, type=int)
    items_per_page = blueprint.config["items_per_page"]
    pagination_serverside = blueprint.config["pagination_serverside"]
    total_items = DB.session.scalar(select(func.count("*")).select_from(q))
    # we can't use DB.paginate() here because it use a .scalars() which return only the first item of the select
    results = (
        DB.session.execute(q.limit(items_per_page).offset(page * items_per_page)).unique().all()
    )

    if pagination_serverside:
        data = results.items
    else:
        data = DB.session.execute(q).unique().all()

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
    plots = data.pop("cor_plots", [])

    try:
        # Create Site
        site = TBaseSites(
            id_nomenclature_type_site=get_id_type_site(blueprint.config["site_type_code"]),
            base_site_name=f"HAB - {MODULE_CODE} - {data['transect_label']}",
            base_site_description=data.pop("base_site_description", None),
            first_use_date=datetime.datetime.now(),
            id_digitiser=g.current_user.id_role,
            geom=func.ST_MakeLine(data.get("geom_start"), data.get("geom_end")),
        )
        DB.session.add(site)
        DB.session.flush()  # Get site ID before commit

        # Assign site ID and generate site code
        data["id_base_site"] = site.id_base_site
        site.base_site_code = f"HAB-{MODULE_CODE}-{site.id_base_site}"
        # TODO: use the session.commit() instead of merge() wherever it is relevant
        # Useless to use merge() here because session.commit() do the same with the site object
        # DB.session.merge(site)

        # Create Transect and associated plots
        transect = TTransect(**data)

        for plot in plots:
            transect_plot = TPlot(**plot)
            transect.cor_plots.append(transect_plot)

        DB.session.add(transect)
        DB.session.commit()

        return load_transect(site.id_base_site)

    except Exception as e:
        DB.session.rollback()
        return {"error": str(e)}, 500


@blueprint.route("/transects/<id_transect>", methods=["PATCH"])
@permissions.check_cruved_scope("U", get_scope=True, module_code=MODULE_CODE)
@json_resp
def update_transect(id_transect, scope):
    """
    Mettre à jour un transect
    """
    data = dict(request.get_json())

    # Update base site table
    DB.session.execute(
        update(TBaseSites)
        .filter_by(id_base_site=data.get("id_base_site"))
        .values(
            base_site_description=data.pop("base_site_description", None),
            geom=func.ST_MakeLine(data.get("geom_start"), data.get("geom_end")).execution_options(
                synchronize_session="fetch"
            ),
        )
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
