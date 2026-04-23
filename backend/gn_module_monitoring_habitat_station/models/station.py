from .base import MonitoringHabitatStation
from .transect import TTransect
from geonature.utils.env import DB, db

from utils_flask_sqla.serializers import serializable
from utils_flask_sqla_geo.serializers import geoserializable
from geoalchemy2 import Geometry



@serializable
@geoserializable
class Station(MonitoringHabitatStation):
    __tablename__= "t_stations"
    __table_args__ = {
        "schema": "pr_monitoring_habitat_station",
    }
    id_station = DB.Column(
        DB.Integer, primary_key=True, server_default=DB.FetchedValue()
    )
    remarks = DB.Column(
        DB.Text,
        nullable = True,
    )
    geom = DB.Column(
        Geometry("GEOMETRY",4326)
    )
    cd_hab = DB.Column(
        DB.ForeignKey(
            "ref_habitats.habref.cd_hab",
            onupdate="CASCADE",
        ),
        nullable = False,
    )
    cor_transect = DB.relationship(TTransect, overlaps="station")