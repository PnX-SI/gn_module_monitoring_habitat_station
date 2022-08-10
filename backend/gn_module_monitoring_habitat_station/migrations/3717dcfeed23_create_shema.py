"""create shema

Revision ID: 3717dcfeed23
Revises: 349fb0607977e059
Create Date: 2022-08-09 16:09:23.592635

"""

import importlib

from alembic import op
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision = '3717dcfeed23'
down_revision = '349fb0607977e059'
branch_labels = None
depends_on = None


def upgrade():
    operations = text(
        importlib.resources.read_text(
            "gn_module_monitoring_habitat_station.migrations.data", "schema.sql"
        )
    )
    op.get_bind().execute(operations)


def downgrade():
    op.execute("DROP SCHEMA pr_monitoring_habitat_station CASCADE")
