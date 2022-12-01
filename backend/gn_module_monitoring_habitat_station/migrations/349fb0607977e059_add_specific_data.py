"""Add specific data

Revision ID: 349fb0607977e059
Create Date: 2022-08-09 11:58:17.392946

"""
from importlib.resources import read_text

from gn_conservation_backend_shared.migrations.utils import monitoring, habitats, commons

from gn_module_monitoring_habitat_station import MODULE_NAME, MODULE_CODE, METADATA_NAME


# revision identifiers, used by Alembic.
revision = "349fb0607977e059"
down_revision = None
branch_labels = MODULE_NAME.lower().replace(" ", "_")
depends_on = ("0a97fffb151c",)  # Add nomenclatures shared in conservation modules


def upgrade():
    habitats.add_habitats_list(METADATA_NAME)
    commons.update_module(
        code=MODULE_CODE,
        label="Suivi Habitat Station",
        description="Module de Suivi des habitats.",
        doc_url="https://github.com/PnX-SI/gn_module_suivi_habitat_station/",
    )


def downgrade():
    monitoring.delete_sites(MODULE_CODE)
    habitats.delete_habitats_list(METADATA_NAME)
    commons.delete_module(MODULE_CODE)
