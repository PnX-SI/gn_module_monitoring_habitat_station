from flask import request
from sqlalchemy import select
from sqlalchemy.sql.expression import func
from werkzeug.exceptions import NotFound
from psycopg2.errors import UniqueViolation
from sqlalchemy.exc import IntegrityError

from geonature.utils.env import DB
from geonature.core.gn_permissions import decorators as permissions
from utils_flask_sqla.response import json_resp

from ..blueprint import blueprint
from ..models import TemperatureSensor, TTransect
from gn_module_monitoring_habitat_station import MODULE_CODE


def load_sensor(id_sensor):
    data = DB.session.execute(
        select(
            TemperatureSensor,
            TTransect.transect_label
        )
        .filter_by(id_sensor = id_sensor)
        .outerjoin(TTransect, TemperatureSensor.id_transect == TTransect.id_transect)
    ).first()
    if data:
        sensor = data[0].as_dict()
        if data[1]:
            sensor["transect_label"] = str(data[1])      
        return sensor
    return None


@blueprint.route("/sensors", methods=["POST"])
@permissions.check_cruved_scope("C", get_scope= True, module_code=MODULE_CODE)
@json_resp
def add_sensor(scope):

    data = dict(request.get_json())
    try:
        sensor = TemperatureSensor(**data)
        DB.session.add(sensor)
        DB.session.commit()
        return load_sensor(sensor.id_sensor)
    except IntegrityError as e:
        DB.session.rollback()
        if isinstance(e.orig, UniqueViolation):
            return {"error": "This sensor is already installed on a transect at this date"},409
    except Exception as e:
            DB.session.rollback()
            return {"error": str(e)}, 500
            

@blueprint.route("/transects/<id_transect>/sensors", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_sensors_by_transect(id_transect):

    query =select(TemperatureSensor).filter_by(id_transect=id_transect)
    page = request.args.get("page", 0, type=int)
    total_items = DB.session.scalar(select(func.count("*")).select_from(query))
    items_per_page = blueprint.config["items_per_page"]
    data = DB.session.scalars(query).unique().all()

    pageInfo = {
        "totalItems": total_items,
        "itemsPerPage": items_per_page,
    }
    if data:
        return [pageInfo, [d.as_dict() for d in data]]
    return None

@blueprint.route("/sensors/<id_sensor>", methods = ["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_one_sensor(id_sensor):
    """
        Return a sensor using his id
    """
    return load_sensor(id_sensor)


@blueprint.route("/sensors/<id_sensor>", methods = ["PATCH"])
@permissions.check_cruved_scope("U",get_scope = True, module_code=MODULE_CODE)
@json_resp
def update_sensor(id_sensor, scope):
    data = dict(request.get_json())
    try:

        sensor = TemperatureSensor(**data)
        DB.session.merge(sensor)
        DB.session.commit()
        return load_sensor(id_sensor)
    except Exception as e:
        DB.session.rollback()
        return {"error": str(e)}, 500
    
@blueprint.route("/sensors/<id_sensor>", methods=["DELETE"])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
@json_resp
def delete_sensor(id_sensor):
   try:
        
        sensor = DB.session.get(TemperatureSensor, id_sensor)
        if sensor == None:
            raise NotFound(f"Sensor {id_sensor} does not exist")
        else:
          DB.session.delete(sensor) 
          DB.session.commit() 
          return {"message": "Sensor deleted successfully"}
   except Exception as e:
       DB.session.rollback()
       return {"error": str(e)}, 500
    