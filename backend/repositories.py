from flask import Blueprint, request, session, current_app

from sqlalchemy.sql.expression import func
from pypnusershub.db.tools import InsufficientRightsError
import re

from geonature.utils.errors import GeonatureApiError
from geonature.core.gn_monitoring.models import TBaseVisits
from geonature.utils.env import DB, ROOT_DIR
from .models import Taxonomie, CorHabTaxon
from pypnnomenclature.models import TNomenclatures, BibNomenclaturesTypes


class PostYearError (GeonatureApiError):
    pass


def check_user_cruved_visit(user, visit, cruved_level):
    """
    Check if user have right on a visit object, related to his cruved
    if not, raise 403 error
    if allowed return void
    """

    is_allowed = False
    if cruved_level == '1':

        for role in visit.observers:
            if role.id_role == user.id_role:
                print('même id ')
                is_allowed = True
                break
            elif visit.id_digitiser == user.id_role:
                is_allowed = True
                break
        if not is_allowed:
            raise InsufficientRightsError(
                ('User "{}" cannot update visit number {} ')
                .format(user.id_role, visit.id_base_visit),
                403
            )

    elif cruved_level == '2':
        for role in visit.observers:
            if role.id_role == user.id_role:
                print('même role')
                is_allowed = True
                break
            elif visit.id_digitiser == user.id_role:
                is_allowed = True
                break
            elif role.id_organisme == user.id_organisme:
                is_allowed = True
                break
        if not is_allowed:
            raise InsufficientRightsError(
                ('User "{}" cannot update visit number {} ')
                .format(user.id_role, visit.id_base_visit),
                403
            )


def check_year_visit(id_base_site, new_visit_date):
    """
    Check if there is already a visit of the same year.
    If yes, observer is not allowed to post the new visit
    """
    q_year = DB.session.query(
        func.date_part('year', TBaseVisits.visit_date_min)).filter(
        TBaseVisits.id_base_site == id_base_site)
    tab_old_year = q_year.all()
    print(tab_old_year)
    year_new_visit = new_visit_date[0:4]

    for y in tab_old_year:
        year_old_visit = str(int(y[0]))
        if year_old_visit == year_new_visit:
            DB.session.rollback()
            raise PostYearError(
                ('Maille {} has already been visited in {} ')
                .format(id_base_site, year_old_visit),
                403)

def get_taxonlist_by_cdhab(cdhab):
    q = DB.session.query(
    CorHabTaxon.id_cor_hab_taxon,
    Taxonomie.lb_nom
    ).join(
        Taxonomie, CorHabTaxon.cd_nom == Taxonomie.cd_nom
    ).group_by(CorHabTaxon.id_habitat, CorHabTaxon.id_cor_hab_taxon, Taxonomie.lb_nom)

    q = q.filter(CorHabTaxon.id_habitat == cdhab)
    data = q.all()

    taxons = []
    if data:
        for d in data:
            taxons.append( str(d[1]) )
        return taxons
    return None


def get_stratelist_plot():
    q = DB.session.query(
        TNomenclatures.label_default
        ).join(BibNomenclaturesTypes, BibNomenclaturesTypes.id_type == TNomenclatures.id_type)

    q = q.filter(BibNomenclaturesTypes.mnemonique == 'STRATE_PLACETTE')
    data = q.all()
    strates = []
    if data:
        for d in data:
            strates.append( str(d[0]) )
        return strates
    return None


def clean_string(my_string):
    my_string = my_string.strip()
    chars_to_remove =  ";,"
    for c in chars_to_remove:
        my_string = my_string.replace(c, "-")

    return my_string


def striphtml(data):
    p = re.compile(r'<.*?>')
    return p.sub('', data)


def get_base_column_name():
    """
    mapping column name / label column

    "idbsite": "Identifiant site",
    "transectlab": "Label transect",
    "visitdate": "Date visite",
    "idbvisit": "Identifiant visite",
    "idreleve": Identifiant relevé",
    "codeplot": "Code placette",
    "plotpos": "Position placette",
    "plotsize": "Taille placette mètres",
    "observers": "Observateurs",
    "organisme" : "Organisme",
    "lbhab": "Habitat",
    "geom": "Points de départ et arrivée",
    "lbperturb": "Perturbation",
    "crotte": "Présence de crottes"

    """
    return [
            "Identifiant site",
            "Label transect",
            "Date visite",
            "Identifiant visite",
            "Identifiant relevé",
            "Code placette",
            "Position placette",
            "Taille placette mètres",
            "Observateurs",
            "Organisme",
            "Habitat",
            "Points de départ et arrivée",
            "Perturbation",
            "Présence de crottes"
        ]

def get_pro_column_name():
    """
    mapping column name / label column
    "cd_hab": "cdhab",
    "covcdnom" : "covcdnom",
    "covidstrate": "covidstrate"
    """
    return [
        "cdhab",
        "covcdnom",
        "covidstrate",
        "idperturb"
        ]

def get_mapping_columns():
    return {
        "idbsite": "Identifiant site",
        "transectlab": "Label transect",
        "visitdate": "Date visite",
        "idbvisit": "Identifiant visite",
        "idreleve": "Identifiant relevé",
        "codeplot": "Code placette",
        "plotpos": "Position placette",
        "plotsize": "Taille placette mètres",
        "observers": "Observateurs",
        "organisme" : "Organisme",
        "lbhab": "Habitat",
        "geom_start": "geom_start",
        "geom_end": "geom_end",
        "lbperturb": "Perturbation",
        "crotte": "Présence de crottes",
        "cd_hab": "cdhab",
        "geom": "Points de départ et arrivée",
        "covstrate": "covstrate",
        "covcdnom" : "covcdnom",
        "covtaxons": "covtaxons",
        "covidstrate": "covidstrate",
        "idperturb": "idperturb"
    }