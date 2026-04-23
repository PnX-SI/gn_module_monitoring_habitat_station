from .base import MonitoringHabitatStation
from .transect import TPlot
from .habitat import CorHabTaxon
from geoalchemy2 import Geometry
from geonature.utils.env import DB, db
from geonature.core.gn_monitoring.models import TBaseVisits

from utils_flask_sqla.serializers import serializable
from utils_flask_sqla_geo.serializers import geoserializable, shapeserializable
from pypn_habref_api.models import Habref
from apptax.taxonomie.models import Taxref

from pypnnomenclature.models import TNomenclatures



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

    id_releve_plot_strat = DB.Column(DB.Integer, primary_key=True, server_default=DB.FetchedValue())
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
    cover_pourcentage = DB.Column(DB.Float)

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

    cor_visit_perturbation = DB.relationship(CorTransectVisitPerturbation, backref="t_base_visits")
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
    lbhab = DB.Column(DB.Unicode)
    geom_start = DB.Column(Geometry("GEOMETRY", 4326))
    geom_end = DB.Column(Geometry("GEOMETRY", 4326))
    lbperturb = DB.Column(DB.Unicode)
    crottes = DB.Column(DB.Boolean)
    cd_hab = DB.Column(DB.Integer)
    geom = DB.Column(Geometry("GEOMETRY", 4326))
    covstrate = DB.Column(DB.Unicode)
    covtaxons = DB.Column(DB.Unicode)
    covcdnom = DB.Column(DB.Unicode)
    covcodestrate = DB.Column(DB.Unicode)

