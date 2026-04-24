from flask import request
from sqlalchemy import select
from sqlalchemy.sql.expression import func
from werkzeug.exceptions import NotFound

from geonature.utils.env import DB
from geonature.core.gn_permissions import decorators as permissions
from utils_flask_sqla.response import json_resp

from ..blueprint import blueprint
from ..models import TPlot, TTransect
from gn_module_monitoring_habitat_station import MODULE_CODE


def build_hierarchy(plots, parent_id=None):
    sub_plots = [p for p in plots if p.id_parent == parent_id]
    if not sub_plots:
        return []
    result=[]
    for plot in sub_plots:
        plot_dict = plot.as_dict()
        plot_dict["sub_plots"] = build_hierarchy(plots, parent_id=plot.id_plot)
        result.append(plot_dict)
    return result

def create_plot(plot_data):
      transect = DB.session.get(TTransect, plot_data.get("id_transect"))
      # verify if the transect exist
      if transect is None:
          raise NotFound(f"Transect {plot_data.get('id_transect')} does not exist")
      
      if plot_data.get("id_parent"):
            parent_plot = DB.session.get(TPlot, plot_data.get("id_parent"))
            if parent_plot is None:
                raise NotFound("Parent plot not found")
            if parent_plot.id_transect != plot_data.get("id_transect"):
                return {"error": "Parent plot does not belong to the same transect"}, 400
      plot = TPlot(**plot_data)
      DB.session.add(plot)
      return plot

@blueprint.route("/transects/<id_transect>/plots", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_plot_by_transect(id_transect):
    data = DB.session.scalars(
        select(TPlot)
        .filter_by(id_transect = id_transect)
    ).all()
    result = build_hierarchy(data)
    return result

@blueprint.route("/plots", methods = ["POST"])
@permissions.check_cruved_scope("C", get_scope= True, module_code=MODULE_CODE)
@json_resp
def add_plot(scope):
    
    data = dict(request.get_json())

    try:
        plot = create_plot(data)
        DB.session.commit()
        return plot.as_dict()
    except Exception as e:
        DB.session.rollback()
        return {"error": str(e)}, 500

@blueprint.route("/plots/<id_plot>", methods = ["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_one_plot(id_plot):
    """
        Return a plot using his id
    """
    plot = DB.session.get(TPlot, id_plot)
    if plot is None:
        raise NotFound(f"Plot {id_plot} does not exist")
    
    all_plots = DB.session.scalars(
        select(TPlot)
        .filter_by(id_transect = plot.id_transect)
    ).all()
    plot_dict = plot.as_dict()
    plot_dict["sub_plots"] = build_hierarchy(all_plots, parent_id=plot.id_plot)
    return plot_dict

@blueprint.route("/plots/<id_plot>", methods = ["PATCH"])
@permissions.check_cruved_scope("U",get_scope = True, module_code=MODULE_CODE)
@json_resp
def update_plot(id_plot, scope):
    data = dict(request.get_json())
    try:

        plot = TPlot(**data)
        DB.session.merge(plot)
        DB.session.commit()
        return plot.as_dict()
    except Exception as e:
        DB.session.rollback()
        return {"error": str(e)}, 500


@blueprint.route("/plots/<id_plot>", methods=["DELETE"])
@permissions.check_cruved_scope("D", module_code=MODULE_CODE)
@json_resp
def delete_plot(id_plot):
   try:
        
        plot = DB.session.get(TPlot, id_plot)
        if plot == None:
            raise NotFound(f"Plot {id_plot} does not exist")
        else:
          DB.session.delete(plot) 
          DB.session.commit() 
          return {"message": "Plot deleted successfully"}
   except Exception as e:
       DB.session.rollback()
       return {"error": str(e)}, 500
