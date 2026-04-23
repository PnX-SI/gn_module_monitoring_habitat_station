from flask import request
from geojson import FeatureCollection
from sqlalchemy import select
from sqlalchemy.sql.expression import func
from werkzeug.exceptions import NotFound

from geonature.utils.env import DB
from geonature.core.gn_permissions import decorators as permissions
from utils_flask_sqla.response import json_resp
from pypn_habref_api.models import Habref

from ..blueprint import blueprint
from ..models import Station
from gn_module_monitoring_habitat_station import MODULE_CODE


def load_station(id_station):
    data = DB.session.execute(
        select(
            Station, 
            Habref.lb_hab_fr
        )
        .filter_by(id_station = id_station)
        .outerjoin(Habref, Station.cd_hab == Habref.cd_hab)
    ).first()
    if data:
        station = data[0].as_geofeature("geom", "id_station")
        if data[1]:
            station["properties"]["habitat_name"] = str(data[1])
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
def get_all_sations():
    parameters = request.args

    q = (
        select(
            Station,
            Habref.lb_hab_fr,
        )
        .outerjoin(Habref, Station.cd_hab == Habref.cd_hab) 
    )
    if "filterHab" in parameters:
        q = q.where(Station.cd_hab == parameters["filterHab"])

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
            feature = d[0].as_geofeature("geom","id_station")
            feature["properties"]["habitat_name"] = str(d[1])
            features.append(feature)
        return [pageInfo, FeatureCollection(features)]
    return None


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
