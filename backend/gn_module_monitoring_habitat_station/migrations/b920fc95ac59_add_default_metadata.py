"""add default metadata

Revision ID: b920fc95ac59
Revises: c575c5436f6f
Create Date: 2023-02-17 18:23:37.002533

"""
import importlib

from alembic import op
from sqlalchemy.sql import text

from gn_conservation_backend_shared.migrations.utils import monitoring

from gn_module_monitoring_habitat_station import METADATA_CODE, METADATA_NAME

# revision identifiers, used by Alembic.
revision = 'b920fc95ac59'
down_revision = 'c575c5436f6f'
branch_labels = None
depends_on = None


def upgrade():
    operations = text(
        importlib.resources.read_text("gn_module_monitoring_habitat_station.migrations.data", "metadata.sql")
    )

    op.get_bind().execute(
        operations,
        {
            "metadataName": METADATA_NAME,
            "metadataCode": METADATA_CODE,
        },
    )


def downgrade():
    monitoring.delete_visits_by_dataset(METADATA_CODE)

    op.execute(
        """
        DELETE FROM gn_synthese.t_sources
        WHERE id_source = pr_monitoring_habitat_station.get_source_id()
        """
    )
    op.execute(
        """
        DELETE FROM gn_meta.t_datasets
        WHERE id_dataset = pr_monitoring_habitat_station.get_dataset_id()
        """
    )
    op.get_bind().execute(
        text(
            """
            DELETE FROM gn_meta.t_acquisition_frameworks
            WHERE acquisition_framework_name = :metaDataName
            """
        ),
        {"metaDataName": METADATA_NAME},
    )

    op.execute("DROP FUNCTION pr_monitoring_habitat_station.get_dataset_id")
    op.execute("DROP FUNCTION pr_monitoring_habitat_station.get_source_id")
