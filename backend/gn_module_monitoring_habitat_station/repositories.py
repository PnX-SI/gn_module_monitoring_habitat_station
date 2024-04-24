import re

from sqlalchemy.sql.expression import func
from sqlalchemy import select
from werkzeug.exceptions import Conflict

from apptax.taxonomie.models import Taxref
from geonature.core.gn_monitoring.models import TBaseVisits
from geonature.utils.env import DB
from geonature.utils.errors import GeonatureApiError
from pypnnomenclature.models import TNomenclatures, BibNomenclaturesTypes
from pypnusershub.db.tools import InsufficientRightsError

from .models import CorHabTaxon


class PostYearError(GeonatureApiError):
    pass


def check_user_cruved_visit(user, visit, cruved_level):
    """
    Check if user have right on a visit object, related to his cruved
    if not, raise 403 error
    if allowed return void
    """

    is_allowed = False
    if cruved_level == "1":

        for role in visit.observers:
            if role.id_role == user.id_role:
                is_allowed = True
                break
            elif visit.id_digitiser == user.id_role:
                is_allowed = True
                break
        if not is_allowed:
            raise InsufficientRightsError(
                ('User "{}" cannot update visit number {} ').format(
                    user.id_role, visit.id_base_visit
                ),
                403,
            )

    elif cruved_level == "2":
        for role in visit.observers:
            if role.id_role == user.id_role:
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
                ('User "{}" cannot update visit number {} ').format(
                    user.id_role, visit.id_base_visit
                ),
                403,
            )


# TODO: move this function in conservation shared library. See also SHT and SFT.
# TODO: use Conflict instead of Forbidden.
def check_year_visit(id_base_site, new_visit_date, id_base_visit=None):
    """
    Check if there is already a visit of the same year.
    If yes, observer is not allowed to post the new visit
    """
    query = select(
        func.date_part("year", TBaseVisits.visit_date_min)
        ).where(
        TBaseVisits.id_base_site == id_base_site
    )
    if id_base_visit is not None:
        query = query.where(TBaseVisits.id_base_visit != id_base_visit)
    old_years = DB.session.execute(query).all()

    year_new_visit = new_visit_date[0:4]
    for year in old_years:
        year_old_visit = str(int(year[0]))
        if year_old_visit == year_new_visit:
            DB.session.rollback()
            msg = (
                f"PostYearError - Site {id_base_site} has already been visited in {year_old_visit}"
            )
            raise Conflict(msg)


def get_id_type_site(code):
    query = select(func.ref_nomenclatures.get_id_nomenclature("TYPE_SITE", code))
    return DB.session.execute(query).first()[0]


def get_taxons_by_cd_hab(habitat_code):
    query = (
        select(CorHabTaxon.id_cor_hab_taxon, Taxref.lb_nom)
        .join(Taxref, CorHabTaxon.cd_nom == Taxref.cd_nom)
        .group_by(CorHabTaxon.id_habitat, CorHabTaxon.id_cor_hab_taxon, Taxref.lb_nom)
        .where(CorHabTaxon.id_habitat == habitat_code)
    )
    data = DB.session.execute(query).all()

    taxons = []
    if data:
        for d in data:
            taxons.append(str(d[1]))
        return taxons
    return None


def get_stratelist_plot():
    q = select(
        TNomenclatures.label_default
        ).join(
        BibNomenclaturesTypes, BibNomenclaturesTypes.id_type == TNomenclatures.id_type
        )

    q = q.where(BibNomenclaturesTypes.mnemonique == "STRATE_PLACETTE")
    data = DB.session.execute(q).all()
    strates = []
    if data:
        for d in data:
            strates.append(str(d[0]))
        return strates
    return None


def clean_string(my_string):
    my_string = my_string.strip()
    chars_to_remove = ";,"
    for c in chars_to_remove:
        my_string = my_string.replace(c, "-")

    return my_string


def strip_html(data):
    p = re.compile(r"<.*?>")
    return p.sub("", data)


def get_base_column_name():
    """
    mapping column name / label column

    "idbsite": "Identifiant site",
    "transectlb": "Label transect",
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
        "Présence de crottes",
    ]


def get_pro_column_name():
    """
    mapping column name / label column
    "cd_hab": "cdhab",
    "covcdnom" : "covcdnom"
    """
    return ["cdhab", "covcdnom", "geom_wkt", "covcodestrate"]


def get_mapping_columns():
    return {
        "idbsite": "Identifiant site",
        "transectlb": "Label transect",
        "visitdate": "Date visite",
        "idbvisit": "Identifiant visite",
        "idreleve": "Identifiant relevé",
        "codeplot": "Code placette",
        "plotpos": "Position placette",
        "plotsize": "Taille placette mètres",
        "observers": "Observateurs",
        "organisme": "Organisme",
        "lbhab": "Habitat",
        "geom_start": "geom_start",
        "geom_end": "geom_end",
        "lbperturb": "Perturbation",
        "crotte": "Présence de crottes",
        "cd_hab": "cdhab",
        "geom": "Points de départ et arrivée",
        "geom_wkt": "geom_wkt",
        "covstrate": "covstrate",
        "covcodestrate": "covcodestrate",
        "covcdnom": "covcdnom",
        "covtaxons": "covtaxons",
    }
