# coding: utf-8
from sqlalchemy import Boolean, CheckConstraint, Column, Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.schema import FetchedValue
from geoalchemy2.types import Geometry
import geoalchemy2.functions as geo_funcs

from geojson import Feature, FeatureCollection, LineString

from geoalchemy2 import Geometry
from geoalchemy2.shape import to_shape


from sqlalchemy.dialects.postgresql.base import UUID
from sqlalchemy.orm import relationship
from flask_sqlalchemy import SQLAlchemy

from pypnusershub.db.models import User

from geonature.utils.env import DB
from geonature.utils.utilssqlalchemy import (
    serializable,
    geoserializable,
    GenericQuery,
)
from geonature.utils.utilsgeometry import shapeserializable

from geonature.core.gn_monitoring.models import TBaseSites, TBaseVisits, corVisitObserver


@serializable
class TyporefSHS(DB.Model):
    __tablename__ = 'typoref'
    __table_args__ = {'schema': 'ref_habitat', 'extend_existing': True}

    cd_typo = DB.Column(DB.Integer, primary_key=True,
                        server_default=DB.FetchedValue())


@serializable
class HabrefSHS(DB.Model):
    __tablename__ = 'habref'
    __table_args__ = {'schema': 'ref_habitat', 'extend_existing': True}

    cd_hab = DB.Column(DB.Integer, primary_key=True,
                       server_default=DB.FetchedValue())
    fg_validite = DB.Column(DB.String(20), nullable=False)
    cd_typo = DB.Column(DB.ForeignKey(
        'ref_habitats.typoref.cd_typo', onupdate='CASCADE'), nullable=False)
    lb_code = DB.Column(DB.String(50))
    lb_hab_fr = DB.Column(DB.String(500))
    lb_hab_fr_complet = DB.Column(DB.String(500))
    lb_hab_en = DB.Column(DB.String(500))

    typoref = DB.relationship(
        'TyporefSHS', primaryjoin='HabrefSHS.cd_typo == TyporefSHS.cd_typo', backref='habrefs')


@serializable
class CorListHabitat(DB.Model):
    __tablename__ = 'cor_list_habitat'
    __table_args__ = {'schema': 'ref_habitat', 'extend_existing': True}

    id_cor_list = DB.Column(DB.Integer, primary_key=True,
                            server_default=DB.FetchedValue())
    id_list = DB.Column(DB.ForeignKey(
        'ref_habitats.habref.bib_list_habitat', onupdate='CASCADE'), nullable=False)
    cd_hab = DB.Column(DB.ForeignKey(
        'ref_habitats.habref.cd_hab', onupdate='CASCADE'), nullable=False)


@serializable
class TNomencla(DB.Model):
    __tablename__ = 't_nomenclatures'
    __table_args__ = {'schema': 'ref_nomenclatures', 'extend_existing': True}

    id_nomenclature = DB.Column(
        DB.Integer, primary_key=True, server_default=DB.FetchedValue())
    mnemonique = DB.Column(DB.String(255))
    label_default = DB.Column(DB.String(255), nullable=False)



@serializable
class TPlot(DB.Model):
    __tablename__ = 't_plots'
    __table_args__ = {'schema': 'pr_monitoring_habitat_station'}

    id_plot = DB.Column(DB.Integer, primary_key=True,
                        server_default=DB.FetchedValue())
    id_transect = DB.Column(DB.ForeignKey('pr_monitoring_habitat_station.t_transects.id_transect',
                                          ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    code_plot = DB.Column(DB.String(50))
    distance_plot = DB.Column(DB.Integer)
    #t_transect = DB.relationship('TTransect', primaryjoin='TPlot.id_transect == TTransect.id_transect', backref='t_plots')


@serializable
class TTransect(DB.Model):
    __tablename__ = 't_transects'
    __table_args__ = {'schema': 'pr_monitoring_habitat_station'}

    id_transect = DB.Column(DB.Integer, primary_key=True,
                            server_default=DB.FetchedValue())
    id_base_site = DB.Column(DB.ForeignKey(
        'gn_monitoring.t_base_sites.id_base_site', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    transect_label = DB.Column(DB.String(50))
    geom_start = DB.Column(Geometry('POINT', 4326))
    geom_end = DB.Column(Geometry('POINT', 4326))
    id_nomenclature_plot_position = DB.Column(DB.Integer, nullable=False)
    cd_hab = DB.Column(DB.ForeignKey(
        'ref_habitats.habref.cd_hab', onupdate='CASCADE'), nullable=False)
    plot_size = DB.Column(DB.String(50))

    # habref = DB.relationship('HabrefSHS', primaryjoin='TTransect.cd_hab == HabrefSHS.cd_hab', backref='t_transects')
    t_base_site = DB.relationship('TBaseSites')
    cor_plots = DB.relationship("TPlot", backref='t_plots')

    def get_geofeature(self, recursif=False):
        line = self.points_to_linestring()
        feature = Feature(
            id=str(self.id_base_site),
            geometry=line,
            properties=self.as_dict(recursif),
        )
        return feature

    def points_to_linestring(self):
        point1 = (DB.session.scalar(geo_funcs.ST_X(self.geom_start)),
                  DB.session.scalar(geo_funcs.ST_Y(self.geom_start)))
        point2 = (DB.session.scalar(geo_funcs.ST_X(self.geom_end)),
                  DB.session.scalar(geo_funcs.ST_Y(self.geom_end)))
        return LineString([point1, point2])




@serializable
class CorHabTaxon(DB.Model):
    __tablename__ = 'cor_hab_taxon'
    __table_args__ = (
        DB.UniqueConstraint('id_habitat', 'cd_nom'),
        {'schema': 'pr_monitoring_habitat_station'}
    )

    id_cor_hab_taxon = DB.Column(
        DB.Integer, primary_key=True, server_default=DB.FetchedValue())
    # cd_nom = DB.Column(DB.ForeignKey('taxonomie.taxref.cd_nom', onupdate='CASCADE'), nullable=False)
    cd_nom = DB.Column(DB.Integer, nullable=False)
    id_habitat = DB.Column(DB.ForeignKey(
        'ref_habitats.habref.cd_hab', onupdate='CASCADE'), nullable=False)
    # taxref = DB.relationship('Taxref', primaryjoin='CorHabTaxon.cd_nom == Taxref.cd_nom', backref='cor_hab_taxons')
    habref = DB.relationship(
        'HabrefSHS', primaryjoin='CorHabTaxon.id_habitat == HabrefSHS.cd_hab', backref='cor_hab_taxons')




@serializable
class CorRelevePlotStrat(DB.Model):
    __tablename__ = 'cor_releve_plot_strats'
    __table_args__ = {'schema': 'pr_monitoring_habitat_station'}

    id_releve_plot_strat = DB.Column(
        DB.Integer, primary_key=True, server_default=DB.FetchedValue())
    id_releve_plot = DB.Column(DB.ForeignKey(
        'pr_monitoring_habitat_station.t_releve_plots.id_releve_plot', onupdate='CASCADE'), nullable=False)
    id_nomenclature_strate = DB.Column(DB.ForeignKey(
        'ref_nomenclatures.t_nomenclatures.id_nomenclature', onupdate='CASCADE'), nullable=False)
    cover_pourcentage = DB.Column(DB.Integer)

    #t_nomenclature = DB.relationship('TNomencla', primaryjoin='CorRelevePlotStrat.id_nomenclature_strate == TNomencla.id_nomenclature', backref='cor_releve_plot_strats')
    # t_releve_plot = DB.relationship('TRelevePlot', primaryjoin='CorRelevePlotStrat.id_releve_plot == TRelevePlot.id_releve_plot', backref='cor_releve_plot_strats')


@serializable
class CorRelevePlotTaxon(DB.Model):
    __tablename__ = 'cor_releve_plot_taxons'
    __table_args__ = {'schema': 'pr_monitoring_habitat_station'}

    id_cor_releve_plot_taxon = DB.Column(
        DB.Integer, primary_key=True, server_default=DB.FetchedValue())
    id_releve_plot = DB.Column(DB.ForeignKey(
        'pr_monitoring_habitat_station.t_releve_plots.id_releve_plot', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    id_cor_hab_taxon = DB.Column(DB.ForeignKey(
        'pr_monitoring_habitat_station.cor_hab_taxon.id_cor_hab_taxon', onupdate='CASCADE'), nullable=False)
    cover_pourcentage = DB.Column(DB.Integer)

    #cor_hab_taxon = DB.relationship('CorHabTaxon', primaryjoin='CorRelevePlotTaxon.id_cor_hab_taxon == CorHabTaxon.id_cor_hab_taxon', backref='cor_releve_plot_taxons')
    # t_releve_plot = DB.relationship('TRelevePlot', primaryjoin='CorRelevePlotTaxon.id_releve_plot == TRelevePlot.id_releve_plot', backref='cor_releve_plot_taxons')


@serializable
class TRelevePlot(DB.Model):
    __tablename__ = 't_releve_plots'
    __table_args__ = {'schema': 'pr_monitoring_habitat_station'}

    id_releve_plot = DB.Column(
        DB.Integer, primary_key=True, server_default=DB.FetchedValue())
    id_plot = DB.Column(DB.ForeignKey('pr_monitoring_habitat_station.t_plots.id_plot',
                                      ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    id_base_visit = DB.Column(DB.ForeignKey(
        'gn_monitoring.t_base_visits.id_base_visit', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    excretes_presence = DB.Column(DB.Boolean)

    cor_releve_strats = DB.relationship(
        'CorRelevePlotStrat', backref='id_releve_plot_s')
    cor_releve_taxons = DB.relationship(
        "CorRelevePlotTaxon", backref='id_releve_plot_t')

    #t_base_visit = DB.relationship('TBaseVisits', primaryjoin='TRelevePlot.id_base_visit == TBaseVisits.id_base_visit', backref='t_releve_plots')
    #t_plot = DB.relationship('TPlot', primaryjoin='TRelevePlot.id_plot == TPlot.id_plot', backref='t_releve_plots')



@serializable
class CorTransectVisitPerturbation(DB.Model):
    __tablename__ = 'cor_transect_visit_perturbation'
    __table_args__ = {'schema': 'pr_monitoring_habitat_station'}

    id_cor_transect_visit_perturb = DB.Column(
        DB.Integer, primary_key=True, server_default=DB.FetchedValue())
    id_base_visit = DB.Column(DB.ForeignKey(
        'gn_monitoring.t_base_visits.id_base_visit', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    id_nomenclature_perturb =  DB.Column(DB.ForeignKey(
        'ref_nomenclatures.t_nomenclatures.id_nomenclature', onupdate='CASCADE'), nullable=False)

    #t_base_visit = DB.relationship('TBaseVisits', primaryjoin='CorTransectVisitPerturbation.id_base_visit == TBaseVisits.id_base_visit', backref='cor_transect_visit_perturbations')
    t_nomenclature = DB.relationship('TNomencla', primaryjoin='CorTransectVisitPerturbation.id_nomenclature_perturb == TNomencla.id_nomenclature', backref='cor_perturb_nomencla')


@serializable
class Taxonomie(DB.Model):
    __tablename__ = 'taxref'
    __table_args__ = {
        'schema': 'taxonomie',
        'extend_existing': True
    }

    cd_nom = DB.Column(
        DB.Integer,
        primary_key=True
    )
    nom_complet = DB.Column(DB.Unicode)
    lb_nom = DB.Column(DB.Unicode)


@serializable
class TVisitSHS(TBaseVisits):
    __tablename__ = 't_base_visits'
    __table_args__ = {'schema': 'gn_monitoring', 'extend_existing': True}

    cor_visit_perturbation = DB.relationship(
        'CorTransectVisitPerturbation', backref='t_base_visits')

    cor_releve_plot = DB.relationship(
        "TRelevePlot", backref='t_base_visits')

    observers = DB.relationship(
        'User',
        secondary=corVisitObserver,
        primaryjoin=(
            corVisitObserver.c.id_base_visit == TBaseVisits.id_base_visit
        ),
        secondaryjoin=(corVisitObserver.c.id_role == User.id_role),
        foreign_keys=[
            corVisitObserver.c.id_base_visit,
            corVisitObserver.c.id_role
        ]
    )

@serializable
@geoserializable
@shapeserializable
class ExportVisits(DB.Model):
    __tablename__ = 'export_visits'
    __table_args__ = {
        'schema': 'pr_monitoring_habitat_station',
    }

    idbsite = DB.Column(DB.Integer)
    transectlb = DB.Column(DB.Unicode)
    visitdate = DB.Column(DB.DateTime)
    idbvisit= DB.Column(DB.Integer)
    idreleve= DB.Column(
        DB.Integer,
        primary_key=True
    )
    codeplot = DB.Column(DB.Unicode)
    plotpos = DB.Column(DB.Integer)
    plotsize = DB.Column(DB.Integer)
    observers = DB.Column(DB.Unicode)
    organisme = DB.Column(DB.Unicode)
    lbhab = DB.Column(DB.Unicode)
    geom_start = DB.Column(Geometry('GEOMETRY', 4326))
    geom_end = DB.Column(Geometry('GEOMETRY', 4326))
    lbperturb = DB.Column(DB.Unicode)
    crotte = DB.Column(DB.Boolean)
    cd_hab = DB.Column(DB.Integer)
    geom = DB.Column(Geometry('GEOMETRY', 4326))
    covstrate = DB.Column(DB.Unicode)
    covtaxons = DB.Column(DB.Unicode)
    covcdnom = DB.Column(DB.Unicode)
    covcodestrate = DB.Column(DB.Unicode)

