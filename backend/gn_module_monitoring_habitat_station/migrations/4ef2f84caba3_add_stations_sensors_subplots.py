"""add_stations_sensors_subplots

Revision ID: 4ef2f84caba3
Revises: 352a1cc0b350
Create Date: 2026-04-16 16:53:39.420714

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4ef2f84caba3'
down_revision = '352a1cc0b350'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """ 
            CREATE TABLE pr_monitoring_habitat_station.t_stations (
                id_station SERIAL PRIMARY KEY,
                id_base_site INTEGER NOT NULL UNIQUE,
                cd_hab INTEGER NOT NULL,
                CONSTRAINT fk_t_stations_id_base_site
                        FOREIGN KEY (id_base_site)
                        REFERENCES gn_monitoring.t_base_sites(id_base_site)
                        ON UPDATE CASCADE ON DELETE CASCADE,
                CONSTRAINT fk_t_stations_cd_hab
                        FOREIGN KEY (cd_hab)
                        REFERENCES ref_habitats.habref(cd_hab)
                        ON UPDATE CASCADE
                );

        """
    )
    
    op.execute(
        """
            CREATE TABLE pr_monitoring_habitat_station.t_temperature_sensors(
                id_sensor SERIAL PRIMARY KEY,
                id_transect INTEGER NOT NULL,
                serial_number VARCHAR(50) NOT NULL,
                install_date DATE NOT NULL,
                CONSTRAINT fk_t_temperature_sensors_id_transect
                FOREIGN KEY (id_transect)
                REFERENCES pr_monitoring_habitat_station.t_transects(id_transect)
                ON UPDATE CASCADE ON DELETE CASCADE,
                CONSTRAINT unique_sensor_transect_date
                UNIQUE(serial_number, id_transect,install_date)
                );    
                
        """
    )
    
    op.execute(
        """
            ALTER TABLE pr_monitoring_habitat_station.t_transects
            ADD COLUMN id_station INTEGER NULL;
                
        """
    )
    
    
    op.execute(
        """
            ALTER TABLE pr_monitoring_habitat_station.t_transects
            ADD CONSTRAINT fk_t_transect_id_station
            FOREIGN KEY(id_station)
            REFERENCES pr_monitoring_habitat_station.t_stations(id_station)
            ON UPDATE CASCADE ON DELETE SET NULL;
                
        """
    )
    
    op.execute(
        """
            ALTER TABLE pr_monitoring_habitat_station.t_plots
            ADD COLUMN id_parent INTEGER NULL;
        """
    )
    
    op.execute(
        """
            ALTER TABLE pr_monitoring_habitat_station.t_plots
            ADD CONSTRAINT fk_t_plots_id_parent
            FOREIGN KEY (id_parent)
            REFERENCES pr_monitoring_habitat_station.t_plots(id_plot);
            
        """
    )

    op.execute(
        """ 
            ALTER TABLE pr_monitoring_habitat_station.t_plots     
            ALTER COLUMN code_plot
            SET NOT NULL;

        """
    )


def downgrade():
    op.execute(
        """
            ALTER TABLE pr_monitoring_habitat_station.t_plots     
            ALTER COLUMN code_plot
            DROP NOT NULL;

        """
    )
    op.execute(
        """
            ALTER TABLE pr_monitoring_habitat_station.t_plots 
            DROP CONSTRAINT fk_t_plots_id_parent;

        """
    )
    op.execute(
        """
            ALTER TABLE pr_monitoring_habitat_station.t_plots 
            DROP COLUMN id_parent;

        """
    )
    op.execute(
        """
            ALTER TABLE pr_monitoring_habitat_station.t_transects
            DROP CONSTRAINT fk_t_transect_id_station;
        """
    )
    op.execute(
        """
            ALTER TABLE pr_monitoring_habitat_station.t_transects
            DROP COLUMN id_station;
                
        """
    )
    op.execute(
        """
            DROP TABLE pr_monitoring_habitat_station.t_temperature_sensors;

        """
    )
    op.execute(
        """
            DROP TABLE pr_monitoring_habitat_station.t_stations;

        """
    )
    
    
    
    
