"""fix fk constraints

Revision ID: 3f922f5e5029
Revises: d8c582c7cfa7
Create Date: 2026-11-10 16:46:29.438397

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '3f922f5e5029'
down_revision = 'd8c582c7cfa7'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        ALTER TABLE pr_monitoring_habitat_station.cor_releve_plot_strats
            DROP CONSTRAINT fk_cor_releve_plot_strats_id_releve_plot ;

        ALTER TABLE pr_monitoring_habitat_station.cor_releve_plot_strats
            ADD CONSTRAINT fk_cor_releve_plot_strats_id_releve_plot
            FOREIGN KEY (id_releve_plot)
            REFERENCES pr_monitoring_habitat_station.t_releve_plots(id_releve_plot)
            ON DELETE CASCADE ON UPDATE CASCADE ;
        """
    )


def downgrade():
    op.execute(
        """
        ALTER TABLE pr_monitoring_habitat_station.cor_releve_plot_strats
            DROP CONSTRAINT fk_cor_releve_plot_strats_id_releve_plot ;

        ALTER TABLE pr_monitoring_habitat_station.cor_releve_plot_strats
            ADD CONSTRAINT fk_cor_releve_plot_strats_id_releve_plot
            FOREIGN KEY (id_releve_plot)
            REFERENCES pr_monitoring_habitat_station.t_releve_plots(id_releve_plot)
            ON UPDATE CASCADE;
        """
    )
