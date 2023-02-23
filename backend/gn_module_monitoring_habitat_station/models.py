from geoalchemy2 import Geometry
import geoalchemy2.functions as geo_funcs
from geojson import Feature, LineString

from pypnusershub.db.models import User
from pypnnomenclature.models import TNomenclatures
from pypn_habref_api.models import Habref
from apptax.taxonomie.models import Taxref

from geonature.utils.env import DB, db

from utils_flask_sqla.serializers import serializable
from utils_flask_sqla_geo.serializers import geoserializable
from geonature.utils.utilsgeometry import shapeserializable

from geonature.core.gn_monitoring.models import TBaseVisits


class MonitoringHabitatStation(db.Model):
    """
    Module DB master parent abstract class.
    Debug is more easy.
    """

    __abstract__ = True

    def __repr__(self):
        return str(self.__class__) + ": " + str(self.__dict__)

    def __str__(self):
        return str(self.__class__) + ": " + str(self.__dict__)


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
    code_plot = DB.Column(DB.String(50))
    distance_plot = DB.Column(DB.Integer)


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
        DB.ForeignKey("ref_habitats.habref.cd_hab", onupdate="CASCADE"), nullable=False
    )
    plot_size = DB.Column(DB.String(50))
    plot_shape = DB.Column(DB.Unicode())

    t_base_site = DB.relationship("TBaseSites")
    cor_plots = DB.relationship("TPlot")

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


@serializable
class TRelevePlot(MonitoringHabitatStation):
    __tablename__ = "t_releve_plots"
    __table_args__ = {"schema": "pr_monitoring_habitat_station"}

    id_releve_plot = DB.Column(DB.Integer, primary_key=True, server_default=DB.FetchedValue())
    id_plot = DB.Column(
        DB.ForeignKey(
            "pr_monitoring_habitat_station.t_plots.id_plot",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    id_base_visit = DB.Column(
        DB.ForeignKey(
            "gn_monitoring.t_base_visits.id_base_visit",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    excretes_presence = DB.Column(DB.Boolean)

    cor_releve_strats = DB.relationship("CorRelevePlotStrat", backref="id_releve_plot_s")
    cor_releve_taxons = DB.relationship("CorRelevePlotTaxon", backref="id_releve_plot_t")

    t_base_visit = DB.relationship(TBaseVisits)
    t_plot = DB.relationship(TPlot)


@serializable
class CorRelevePlotStrat(MonitoringHabitatStation):
    __tablename__ = "cor_releve_plot_strats"
    __table_args__ = {"schema": "pr_monitoring_habitat_station"}

    id_releve_plot_strat = DB.Column(
        DB.Integer, primary_key=True, server_default=DB.FetchedValue()
    )
    id_releve_plot = DB.Column(
        DB.ForeignKey(
            "pr_monitoring_habitat_station.t_releve_plots.id_releve_plot",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    id_nomenclature_strate = DB.Column(
        DB.ForeignKey("ref_nomenclatures.t_nomenclatures.id_nomenclature", onupdate="CASCADE"),
        nullable=False,
    )
    cover_pourcentage = DB.Column(DB.Integer)

    t_nomenclature = DB.relationship(TNomenclatures)
    t_releve_plot = DB.relationship(TRelevePlot)


@serializable
class CorRelevePlotTaxon(MonitoringHabitatStation):
    __tablename__ = "cor_releve_plot_taxons"
    __table_args__ = {"schema": "pr_monitoring_habitat_station"}

    id_cor_releve_plot_taxon = DB.Column(
        DB.Integer, primary_key=True, server_default=DB.FetchedValue()
    )
    id_releve_plot = DB.Column(
        DB.ForeignKey(
            "pr_monitoring_habitat_station.t_releve_plots.id_releve_plot",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    id_cor_hab_taxon = DB.Column(
        DB.ForeignKey(
            "pr_monitoring_habitat_station.cor_hab_taxon.id_cor_hab_taxon",
            onupdate="CASCADE",
        ),
        nullable=True,
    )
    cd_nom = DB.Column(DB.ForeignKey(Taxref.cd_nom, onupdate="CASCADE"), nullable=False)
    cover_pourcentage = DB.Column(DB.Integer)

    cor_hab_taxon = DB.relationship(CorHabTaxon)
    t_releve_plot = DB.relationship(TRelevePlot)
    sciname = DB.relationship(Taxref)


@serializable
class CorTransectVisitPerturbation(MonitoringHabitatStation):
    __tablename__ = "cor_transect_visit_perturbation"
    __table_args__ = {"schema": "pr_monitoring_habitat_station"}

    id_cor_transect_visit_perturb = DB.Column(
        DB.Integer, primary_key=True, server_default=DB.FetchedValue()
    )
    id_base_visit = DB.Column(
        DB.ForeignKey(
            "gn_monitoring.t_base_visits.id_base_visit",
            ondelete="CASCADE",
            onupdate="CASCADE",
        ),
        nullable=False,
    )
    id_nomenclature_perturb = DB.Column(
        DB.ForeignKey("ref_nomenclatures.t_nomenclatures.id_nomenclature", onupdate="CASCADE"),
        nullable=False,
    )

    t_base_visit = DB.relationship(TBaseVisits)
    t_nomenclature = DB.relationship(TNomenclatures)


@serializable
class Visit(TBaseVisits):
    __tablename__ = "t_base_visits"
    __table_args__ = {"schema": "gn_monitoring", "extend_existing": True}

    def __repr__(self):
        return str(self.__class__) + ": " + str(self.__dict__)

    def __str__(self):
        return str(self.__class__) + ": " + str(self.__dict__)

    cor_visit_perturbation = DB.relationship(
        CorTransectVisitPerturbation, backref="t_base_visits"
    )
    cor_releve_plot = DB.relationship(TRelevePlot, backref="t_base_visits")


@serializable
@geoserializable
@shapeserializable
class ExportVisits(MonitoringHabitatStation):
    __tablename__ = "export_visits"
    __table_args__ = {
        "schema": "pr_monitoring_habitat_station",
    }

    idbsite = DB.Column(DB.Integer)
    transectlb = DB.Column(DB.Unicode)
    visitdate = DB.Column(DB.DateTime)
    idbvisit = DB.Column(DB.Integer)
    idreleve = DB.Column(DB.Integer, primary_key=True)
    codeplot = DB.Column(DB.Unicode)
    plotpos = DB.Column(DB.Integer)
    plotsize = DB.Column(DB.Integer)
    observers = DB.Column(DB.Unicode)
    organisme = DB.Column(DB.Unicode)
    lbhab = DB.Column(DB.Unicode)
    geom_start = DB.Column(Geometry("GEOMETRY", 4326))
    geom_end = DB.Column(Geometry("GEOMETRY", 4326))
    lbperturb = DB.Column(DB.Unicode)
    crotte = DB.Column(DB.Boolean)
    cd_hab = DB.Column(DB.Integer)
    geom = DB.Column(Geometry("GEOMETRY", 4326))
    covstrate = DB.Column(DB.Unicode)
    covtaxons = DB.Column(DB.Unicode)
    covcdnom = DB.Column(DB.Unicode)
    covcodestrate = DB.Column(DB.Unicode)
