from .base import MonitoringHabitatStation
from pypn_habref_api.models import Habref
from apptax.taxonomie.models import Taxref
from utils_flask_sqla.serializers import serializable
from geonature.utils.env import DB


@serializable
class CorHabTaxon(MonitoringHabitatStation):
    __tablename__ = "cor_hab_taxon"
    __table_args__ = (
        DB.UniqueConstraint("id_habitat", "cd_nom"),
        {"schema": "pr_monitoring_habitat_station"},
    )

    id_cor_hab_taxon = DB.Column(DB.Integer, primary_key=True, server_default=DB.FetchedValue())
    cd_nom = DB.Column(DB.ForeignKey(Taxref.cd_nom, onupdate="CASCADE"), nullable=False)
    # cd_nom = DB.Column(DB.Integer, nullable=False)
    id_habitat = DB.Column(DB.ForeignKey(Habref.cd_hab, onupdate="CASCADE"), nullable=False)

    taxref = DB.relationship(Taxref)
    habref = DB.relationship(Habref)
