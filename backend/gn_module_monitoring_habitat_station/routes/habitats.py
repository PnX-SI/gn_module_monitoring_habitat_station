from sqlalchemy import select
from utils_flask_sqla.response import json_resp
from pypn_habref_api.models import BibListHabitat, cor_list_habitat, Habref
from apptax.taxonomie.models import Taxref

from geonature.utils.env import DB
from geonature.core.gn_permissions import decorators as permissions

from ..blueprint import blueprint
from ..models import CorHabTaxon
from gn_module_monitoring_habitat_station import MODULE_CODE



@blueprint.route("/habitats", methods=["GET"])
@permissions.check_cruved_scope("R", module_code=MODULE_CODE)
@json_resp
def get_all_habitats():
    """
    Récupère les habitats utilisé dans ce module.
    """
    query = (
        select(cor_list_habitat.c.cd_hab, Habref.lb_hab_fr)
        .join(Habref, cor_list_habitat.c.cd_hab == Habref.cd_hab)
        .join(BibListHabitat, BibListHabitat.id_list == cor_list_habitat.c.id_list)
        .where(BibListHabitat.list_name == blueprint.config["habitat_list_name"])
        .group_by(
            cor_list_habitat.c.cd_hab,
            Habref.lb_hab_fr,
        )
    )
    data = DB.session.execute(query).all()

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
        select(CorHabTaxon.id_cor_hab_taxon, CorHabTaxon.cd_nom, Taxref.nom_complet_html)
        .join(Taxref, CorHabTaxon.cd_nom == Taxref.cd_nom)
        .group_by(CorHabTaxon.id_habitat, CorHabTaxon.id_cor_hab_taxon, Taxref.nom_complet_html)
        .where(CorHabTaxon.id_habitat == cd_hab)
    )
    data = DB.session.execute(query).all()

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
