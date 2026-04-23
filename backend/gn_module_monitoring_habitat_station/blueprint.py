from flask import Blueprint, g
from geonature.core.gn_permissions import decorators as permissions
from geonature.core.gn_permissions.tools import get_scopes_by_action
from utils_flask_sqla.response import json_resp
from gn_module_monitoring_habitat_station import MODULE_CODE

blueprint = Blueprint("pr_monitoring_habitat_station", __name__)

@blueprint.route("/users/current/cruved", methods=["GET"])
@permissions.check_cruved_scope("R", get_scope=True, module_code=MODULE_CODE)
@json_resp
def get_user_cruved(scope):
    user_cruved = get_scopes_by_action(
        id_role=g.current_user.id_role, module_code=blueprint.config["MODULE_CODE"]
    )
    return user_cruved

from .routes import transects, visits, stations, sensors, habitats