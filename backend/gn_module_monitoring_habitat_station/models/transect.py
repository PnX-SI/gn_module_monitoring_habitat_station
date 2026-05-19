from .base import MonitoringHabitatStation
from geonature.utils.env import DB, db

from utils_flask_sqla.serializers import serializable
from utils_flask_sqla_geo.serializers import geoserializable, shapeserializable
from geoalchemy2 import Geometry
import geoalchemy2.functions as geo_funcs
from geojson import Feature, LineString




@serializable
class TPlot(MonitoringHabitatStation):
    __tablename__ = "t_plots"
    __table_args__ = {"schema": "pr_monitoring_habitat_station"}

    id_plot = DB.Column(DB.Integer, primary_key=True, server_default=DB.FetchedValue())
    id_transect = DB.Column(
        DB.ForeignKey(
            "pr_monitoring_habitat_station.t_transects.id_transect",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    code_plot = DB.Column(DB.String(50), nullable = False)
    distance_plot = DB.Column(DB.Integer)
    id_parent = DB.Column(
        DB.ForeignKey(
            "pr_monitoring_habitat_station.t_plots.id_plot",
            ondelete = "CASCADE", 
        ),
         
    )
    parent = DB.relationship("TPlot", remote_side = [id_plot])
    sub_plots = DB.relationship("TPlot", foreign_keys=[id_parent], passive_deletes=True, overlaps="parent")

@serializable
@geoserializable
class TTransect(MonitoringHabitatStation):
    __tablename__ = "t_transects"
    __table_args__ = {"schema": "pr_monitoring_habitat_station"}

    id_transect = DB.Column(DB.Integer, primary_key=True, server_default=DB.FetchedValue())
    id_base_site = DB.Column(
        DB.ForeignKey(
            "gn_monitoring.t_base_sites.id_base_site",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    transect_label = DB.Column(DB.String(50))
    geom_start = DB.Column(Geometry("POINT", 4326))
    geom_end = DB.Column(Geometry("POINT", 4326))
    id_nomenclature_plot_position = DB.Column(DB.Integer, nullable=False)
    cd_hab = DB.Column(
        DB.ForeignKey("ref_habitats.habref.cd_hab", onupdate="CASCADE"), nullable=True
    )
    plot_size = DB.Column(DB.String(50))
    plot_shape = DB.Column(DB.Unicode())
    id_station = DB.Column(
        DB.ForeignKey(
            "pr_monitoring_habitat_station.t_stations.id_station",
            onupdate= "CASCADE",
            ondelete= "SET NULL",
        )
    )
    azimut = DB.Column(
        DB.Integer, 
        nullable = True,
    )

    t_base_site = DB.relationship("TBaseSites")
    cor_plots = DB.relationship("TPlot", passive_deletes=True)
    station = DB.relationship("Station", overlaps="cor_transect")


    def get_geofeature(self, fields=[]):
        line = self.points_to_linestring()
        feature = Feature(
            id=str(self.id_base_site),
            geometry=line,
            properties=self.as_dict(fields=fields),
        )
        return feature

    def points_to_linestring(self):
        point1 = (
            DB.session.scalar(geo_funcs.ST_X(self.geom_start)),
            DB.session.scalar(geo_funcs.ST_Y(self.geom_start)),
        )
        point2 = (
            DB.session.scalar(geo_funcs.ST_X(self.geom_end)),
            DB.session.scalar(geo_funcs.ST_Y(self.geom_end)),
        )
        return LineString([point1, point2])