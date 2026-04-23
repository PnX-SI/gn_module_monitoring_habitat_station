from .base import MonitoringHabitatStation
from .transect import TTransect
from utils_flask_sqla.serializers import serializable
from geonature.utils.env import DB


@serializable
class TemperatureSensor(MonitoringHabitatStation):
    __tablename__= "t_temperature_sensors"
    __table_args__ = (
        DB.UniqueConstraint("serial_number","id_transect","install_date"),
       { "schema": "pr_monitoring_habitat_station"},
        
    )
    id_sensor = DB.Column(
        DB.Integer, primary_key=True, server_default = DB.FetchedValue()
    )
    id_transect = DB.Column(
        DB.ForeignKey(
            "pr_monitoring_habitat_station.t_transects.id_transect",
            ondelete = "CASCADE",
            onupdate = "CASCADE",
        ),
        nullable = False,
    )
    serial_number = DB.Column(
        DB.String(50),
        nullable = False
    )
    install_date = DB.Column(
        DB.Date,
        nullable = False
    )
    transect = DB.relationship (TTransect)
    
      

