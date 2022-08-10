"""Add specific data

Revision ID: 349fb0607977e059
Create Date: 2022-08-09 11:58:17.392946

"""
import importlib

from alembic import op
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision = '349fb0607977e059'
down_revision = None
branch_labels = "shs"
depends_on = (
    "0a97fffb151c",  # Add nomenclatures shared in conservation modules
)


def upgrade():
    operations = text(
        importlib.resources.read_text(
            "gn_module_monitoring_habitat_station.migrations.data", "data.sql"
        )
    )
    op.get_bind().execute(operations)


def downgrade():
    operations = text(
        importlib.resources.read_text(
            "gn_module_monitoring_habitat_station.migrations.data", "delete_data.sql"
        )
    )
    op.get_bind().execute(operations)
