# coding: utf-8
from sqlalchemy import Boolean, CheckConstraint, Column, Date, DateTime, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.schema import FetchedValue
from geoalchemy2.types import Geometry
from sqlalchemy.dialects.postgresql.base import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql.expression import func

from pypnusershub.db.models import User

from geonature.utils.env import DB
from geonature.utils.utilssqlalchemy import (
    serializable,
    geoserializable,
    GenericQuery,
)
from geonature.utils.utilsgeometry import shapeserializable
#from geonature.core.gn_synthese.models import synthese_export_serialization
from geonature.core.gn_monitoring.models import TBaseSites, TBaseVisits, corVisitObserver
# from geonature.core.taxonomie.models import Taxref
from pypnnomenclature.models import TNomenclatures


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


@serializable
class Typoref(DB.Model):
    __tablename__ = 'typoref'
    __table_args__ = {'schema': 'ref_habitat'}

    cd_typo = DB.Column(DB.Integer, primary_key=True,
                        server_default=DB.FetchedValue())
    cd_table = DB.Column(DB.String(255))
    lb_nom_typo = DB.Column(DB.String(100))
    nom_jeu_donnees = DB.Column(DB.String(255))
    date_creation = DB.Column(DB.String(255))
    date_mise_jour_table = DB.Column(DB.String(255))
    date_mise_jour_metadonnees = DB.Column(DB.String(255))
    auteur_typo = DB.Column(DB.String(4000))
    auteur_table = DB.Column(DB.String(4000))
    territoire = DB.Column(DB.String(4000))
    organisme = DB.Column(DB.String(255))
    langue = DB.Column(DB.String(255))
    presentation = DB.Column(DB.String(4000))


@serializable
class Habref(DB.Model):
    __tablename__ = 'habref'
    __table_args__ = {'schema': 'ref_habitat'}

    cd_hab = DB.Column(DB.Integer, primary_key=True,
                       server_default=DB.FetchedValue())
    fg_validite = DB.Column(DB.String(20), nullable=False)
    cd_typo = DB.Column(DB.ForeignKey('ref_habitat.typoref.cd_typo',
                                      ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    lb_code = DB.Column(DB.String(50))
    lb_hab_fr = DB.Column(DB.String(255))
    lb_hab_fr_complet = DB.Column(DB.String(255))
    lb_hab_en = DB.Column(DB.String(255))
    lb_auteur = DB.Column(DB.String(255))
    niveau = DB.Column(DB.Integer)
    lb_niveau = DB.Column(DB.String(100))
    cd_hab_sup = DB.Column(DB.Integer, nullable=False)
    path_cd_hab = DB.Column(DB.String(2000))
    france = DB.Column(DB.String(5))
    lb_description = DB.Column(DB.String(4000))

    typoref = DB.relationship(
        'Typoref', primaryjoin='Habref.cd_typo == Typoref.cd_typo', backref='habrefs')