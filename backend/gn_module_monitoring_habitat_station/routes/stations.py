from flask import request
from geojson import FeatureCollection
from sqlalchemy import select, func, distinct, and_, or_,desc
from sqlalchemy.sql.expression import func
from werkzeug.exceptions import NotFound

from geonature.utils.env import DB
from geonature.core.gn_permissions import decorators as permissions
from utils_flask_sqla.response import json_resp
from pypn_habref_api.models import Habref
from geonature.core.gn_monitoring.models import  corVisitObserver, TBaseVisits
from ref_geo.models import LAreas
from pypnusershub.db.models import User, Organisme


from ..blueprint import blueprint
from ..models import Station, TTransect
from gn_module_monitoring_habitat_station import MODULE_CODE


def load_station(id_station):
    data = DB.session.execute(
        select(
            Station, 
            Habref.lb_hab_fr,
            func.string_agg(distinct(LAreas.area_name), ", ")
        )
        .filter_by(id_station = id_station)
        .outerjoin(Habref, Station.cd_hab == Habref.cd_hab)
        .outerjoin(
                LAreas,
                and_(
                    func.ST_Intersects(func.ST_Transform(Station.geom, 2154), LAreas.geom),
                    LAreas.id_type == func.ref_geo.get_id_area_type(blueprint.config["municipality_type_code"])
                )
            )
        .group_by(Station.id_station, Habref.lb_hab_fr)
        
    ).first()
    if data:
        station = data[0].as_geofeature("geom", "id_station")
        if data[1]:
            station["properties"]["habitat_name"] = str(data[1])
        if data[2]:
            station["properties"]["nom_commune"] = str(data[2])
        return station
    return None

@blueprint.route("/stations", methods = ["POST"])
@permissions.check_cruved_scope("C", get_scope= True, module_code=MODULE_CODE)
@json_resp
def add_station(scope):
    
    data = dict(request.get_json())
    try:
        station = Station(**data)
        DB.session.add(station)
        DB.session.commit()
        return load_station(station.id_station)
    except Exception as e:
        DB.session.rollback()
        return {"error": str(e)}, 500

@blueprint.route("/stations", methods = ["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_stations():
    parameters = request.args

    q = (
        select(
            Station,
            Habref.lb_hab_fr,
            func.count(distinct(TBaseVisits.id_base_visit)).label("nb_visits"),
            func.max(TBaseVisits.visit_date_min).label("last_visit"),
            func.count(distinct(TTransect.id_transect)).label("nb_transect"),
            func.string_agg(distinct(LAreas.area_name), ", "),
            
        )
        .outerjoin(Habref, Station.cd_hab == Habref.cd_hab) 
        .outerjoin(TTransect, TTransect.id_station == Station.id_station)
        .outerjoin(TBaseVisits, TBaseVisits.id_base_site == TTransect.id_base_site)
        .outerjoin(
                LAreas,
                and_(
                    func.ST_Intersects(func.ST_Transform(Station.geom, 2154), LAreas.geom),
                    LAreas.id_type == func.ref_geo.get_id_area_type(blueprint.config["municipality_type_code"])
                )
            )
        .outerjoin(corVisitObserver, corVisitObserver.c.id_base_visit == TBaseVisits.id_base_visit)
        .outerjoin(User, User.id_role == corVisitObserver.c.id_role)
        .outerjoin(Organisme, Organisme.id_organisme == User.id_organisme)
        .group_by(Station.id_station, Habref.lb_hab_fr)
    )
    if "filterHab" in parameters:
        q = q.where(Station.cd_hab == parameters["filterHab"])
    if "year" in parameters:
        q = q.where(
            func.extract('year', TBaseVisits.visit_date_min) == parameters["year"]
        )
    if 'area_name' in parameters:
        q = q.where(LAreas.area_name == parameters["area_name"])
    if 'observer' in parameters:
        q = q.where(
            or_(
                User.nom_role == parameters["observer"], 
                User.prenom_role == parameters["observer"]
            )
        )
    if 'organism' in parameters:
        q = q.where(Organisme.nom_organisme == parameters["organism"])

    page = request.args.get("page", 1, type=int)
    items_per_page = blueprint.config["items_per_page"]
    pagination_serverside = blueprint.config["pagination_serverside"]
    total_items = DB.session.scalar(select(func.count("*")).select_from(q))
    # we can't use DB.paginate() here because it use a .scalars() which return only the first item of the select
    results = (
        DB.session.execute(q.limit(items_per_page).offset(page * items_per_page)).unique().all()
    )
    

    if pagination_serverside:
        data = DB.session.execute(
            q.limit(items_per_page).offset(page * items_per_page)
        ).unique().all()
    else:
        data = DB.session.execute(q).unique().all()

    pageInfo = {
        "totalItems": total_items,
        "itemsPerPage": items_per_page,
    }
    if data:
        features = []
        for d in data:
            feature = d[0].as_geofeature("geom","id_station")
            feature["properties"]["habitat_name"] = str(d[1])
            feature["properties"]["nb_visits"] = d[2]
            feature["properties"]["last_visit"] = str(d[3]) if d[3] else "Aucune visite"
            feature["properties"]["nb_transect"] = d[4]
            feature["properties"]["commune_name"]= d[5]
            features.append(feature)
        return [pageInfo, FeatureCollection(features)]
    return None


@blueprint.route("/stations/years", methods =["GET"])
@permissions.check_cruved_scope("R", module_code = MODULE_CODE)
@json_resp
def get_years_visits():
    q = (
        select(
            func.extract('year', TBaseVisits.visit_date_min).label("year")
        )
        .outerjoin(TTransect, TTransect.id_base_site == TBaseVisits.id_base_site)
        .outerjoin(Station, Station.id_station == TTransect.id_station)
        .where(TBaseVisits.visit_date_min != None)
        .distinct()
        .order_by(desc(func.extract('year', TBaseVisits.visit_date_min)))
    )  
    data = DB.session.execute(q).all()
    return [int(row[0]) for row in data if row[0] is not None]

@blueprint.route("/stations/area", methods =["GET"])
@permissions.check_cruved_scope("R", module_code = MODULE_CODE)
@json_resp
def get_area():
    q = (
        select(
            LAreas.area_name
        )
        .select_from(Station)
        .outerjoin(
                LAreas,
                and_(
                    func.ST_Intersects(func.ST_Transform(Station.geom, 2154), LAreas.geom),
                    LAreas.id_type == func.ref_geo.get_id_area_type(blueprint.config["municipality_type_code"])
                )
            )
        .where(LAreas.area_name != None)
        .distinct()
        .order_by(LAreas.area_name)
    )
    data = DB.session.execute(q).all()
    return [(row[0]) for row in data if row[0] is not None]

@blueprint.route("/stations/organism", methods =["GET"])
@permissions.check_cruved_scope("R", module_code = MODULE_CODE)
@json_resp
def get_organism():
    q =(
        select(
            Organisme.nom_organisme
        )
        .select_from(Station)
        .outerjoin(TTransect, TTransect.id_station == Station.id_station)
        .outerjoin(TBaseVisits,TBaseVisits.id_base_site == TTransect.id_base_site)
        .outerjoin(corVisitObserver, corVisitObserver.c.id_base_visit == TBaseVisits.id_base_visit)
        .outerjoin(User,  User.id_role == corVisitObserver.c.id_role)
        .outerjoin(Organisme, Organisme.id_organisme == User.id_organisme)
        .distinct()
    )
    data = DB.session.execute(q).all()
    return  [(row[0]) for row in data if row[0] is not None]



@blueprint.route("/stations/<id_station>", methods = ["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_one_station(id_station):
    """
        Return a station using his id
    """
    return load_station(id_station)


@blueprint.route("/stations/<id_station>", methods = ["PATCH"])
@permissions.check_cruved_scope("U",get_scope = True, module_code=MODULE_CODE)
@json_resp
def update_station(id_station, scope):
    data = dict(request.get_json())
    try:

        station = Station(**data)
        DB.session.merge(station)
        DB.session.commit()
        return load_station(id_station)
    except Exception as e:
        DB.session.rollback()
        return {"error": str(e)}, 500

@blueprint.route("/stations/<id_station>", methods=["DELETE"])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
@json_resp
def delete_station(id_station):
   try:
        
        station = DB.session.get(Station, id_station)
        if station == None:
            raise NotFound(f"Station {id_station} does not exist")
        else:
          DB.session.delete(station) 
          DB.session.commit() 
          return {"message": "Station deleted successfully"}
   except Exception as e:
       DB.session.rollback()
       return {"error": str(e)}, 500
