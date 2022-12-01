"""Add module specifics nomenclatures

Revision ID: c575c5436f6f
Revises: 3717dcfeed23
Create Date: 2022-12-01 20:35:42.573077

"""
from importlib.resources import open_text

from gn_conservation_backend_shared.migrations.utils import csv, nomenclatures
from utils_flask_sqla.migrations.utils import logger


# revision identifiers, used by Alembic.
revision = "c575c5436f6f"
down_revision = "3717dcfeed23"
branch_labels = None
depends_on = None


def upgrade():
    nomenclatures.add_nomenclature_type(
        mnemonic="STRATE_PLACETTE",
        label="Strates par placette",
        definition="Nomenclature de strates pour placette.",
        source="CBNA",
    )
    nomenclatures.add_nomenclature_type(
        mnemonic="POSITION_PLACETTE",
        label="Positions de placette sur un transect",
        definition="Nomenclature des positions de placette sur un transect.",
        source="CBNA",
    )

    with open_text(
        "gn_module_monitoring_habitat_station.migrations.data", "nomenclatures.csv"
    ) as csvfile:
        logger.info("Inserting strate and position plot nomenclatures…")
        csv.copy_from_csv(
            csvfile,
            schema="ref_nomenclatures",
            table="t_nomenclatures",
            dest_cols=(
                "id_type",
                "cd_nomenclature",
                "mnemonique",
                "label_default",
                "definition_default",
                "label_fr",
                "definition_fr",
                "id_broader",
                "hierarchy",
            ),  # type: ignore
            source_cols=(
                "ref_nomenclatures.get_id_nomenclature_type(type_nomenclature_code)",
                "cd_nomenclature",
                "mnemonique",
                "label_default",
                "definition_default",
                "label_fr",
                "definition_fr",
                "ref_nomenclatures.get_id_nomenclature(type_nomenclature_code, cd_nomenclature_broader)",
                "hierarchy",
            ),
            header=True,
            encoding="UTF-8",
            delimiter=",",
        )


def downgrade():
    nomenclatures.delete_nomenclatures_by_type("STRATE_PLACETTE")
    nomenclatures.delete_nomenclatures_by_type("POSITION_PLACETTE")
