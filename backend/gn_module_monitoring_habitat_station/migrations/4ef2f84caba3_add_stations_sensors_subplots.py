"""add_stations_sensors_subplots

Revision ID: 4ef2f84caba3
Revises: 352a1cc0b350
Create Date: 2026-04-16 16:53:39.420714

"""
from alembic import op, context
import sqlalchemy as sa



# revision identifiers, used by Alembic.
revision = '4ef2f84caba3'
down_revision = '352a1cc0b350'
branch_labels = None
depends_on = None


def upgrade():
    tag = context.get_tag_argument()
    op.execute(
        """ 
            CREATE TABLE pr_monitoring_habitat_station.t_stations (
                id_station SERIAL PRIMARY KEY,
                geom GEOMETRY(Point, 4326),
                remarks TEXT NULL,
                cd_hab INTEGER NOT NULL,
                name VARCHAR(50) NOT NULL,
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
                UNIQUE(serial_number, id_transect, install_date)
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
            ADD COLUMN azimut INTEGER NULL;
                
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
            REFERENCES pr_monitoring_habitat_station.t_plots(id_plot)
            ON DELETE CASCADE; 
        """
    )

    op.execute(
        """ 
            ALTER TABLE pr_monitoring_habitat_station.t_plots     
            ALTER COLUMN code_plot
            SET NOT NULL;

        """
    )
     # Transect data migration

     # Migration using label tag
    if tag == 'by_label':
        op.execute(
            """
            WITH grouped_transects AS (
                SELECT
                    TRIM(
                        REGEXP_REPLACE(
                            REGEXP_REPLACE(
                                REGEXP_REPLACE(
                                    transect_label,
                                    '\(.*?\)', ''
                                ),
                                '_?T[0-9]+_?', ''
                            ),
                            '^\s+|\s+$', ''
                        )
                    ) AS station_name,
                    MIN(cd_hab) AS cd_hab,
                    ST_Centroid(ST_Collect(geom_start)) AS geom
                FROM pr_monitoring_habitat_station.t_transects
                GROUP BY station_name
            ),
            inserted_stations AS (
                INSERT INTO pr_monitoring_habitat_station.t_stations (name, cd_hab, geom)
                SELECT station_name, cd_hab, geom
                FROM grouped_transects
                RETURNING id_station, name
            )
            UPDATE pr_monitoring_habitat_station.t_transects t
            SET id_station = s.id_station
            FROM inserted_stations s
            WHERE TRIM(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(
                            t.transect_label,
                            '\(.*?\)', ''
                        ),
                        '_?T[0-9]+_?', ''
                    ),
                    '^\s+|\s+$', ''
                )
            ) = s.name;
            """
        )
    else:
        op.execute(
            """
            WITH clustered AS (
                SELECT
                    id_transect,
                    cd_hab,
                    geom_start,
                    ST_ClusterDBSCAN(ST_Transform(geom_start, 2154), eps := 1000, minpoints := 1) OVER () AS cluster_id
                FROM pr_monitoring_habitat_station.t_transects
            ),
            grouped AS (
                SELECT
                    cluster_id,
                    MIN(cd_hab) AS cd_hab,
                    ST_Centroid(ST_Collect(geom_start)) AS geom,
                    'Station ' || cluster_id::text AS name
                FROM clustered
                GROUP BY cluster_id
            ),
            inserted_stations AS (
                INSERT INTO pr_monitoring_habitat_station.t_stations (name, cd_hab, geom)
                SELECT name, cd_hab, geom
                FROM grouped
                RETURNING id_station, name
            )
            UPDATE pr_monitoring_habitat_station.t_transects t
            SET id_station = s.id_station
            FROM inserted_stations s
            JOIN clustered c ON c.cluster_id = CAST(REPLACE(s.name, 'Station ', '') AS INTEGER)
            WHERE t.id_transect = c.id_transect;
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
            ALTER TABLE pr_monitoring_habitat_station.t_transects
            DROP COLUMN azimut;
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
    
    
    
    
