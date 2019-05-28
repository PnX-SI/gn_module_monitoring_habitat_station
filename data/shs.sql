SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

CREATE SCHEMA pr_monitoring_habitat_station;

SET search_path = pr_monitoring_habitat_station, pg_catalog, public;

SET default_with_oids = false;

------------------------
--TABLES AND SEQUENCES--
------------------------

-- Transect
CREATE TABLE t_transects (
    id_transect serial NOT NULL,
    id_base_site integer NOT NULL,
    transect_label character varying(50),
    geom_start public.geometry(Point, MY_SRID_WORLD),
    geom_end public.geometry(Point, MY_SRID_WORLD),
    id_nomenclature_plot_position integer NOT NULL,
    cd_hab integer NOT NULL,
    plot_size character varying(50)
);
COMMENT ON TABLE pr_monitoring_habitat_station.t_transects IS 'Extension de t_base_sites de gn_monitoring, permet d\avoir les infos complémentaires d\un site';

-- Placette
CREATE TABLE t_plots (
    id_plot serial NOT NULL,
    id_transect integer NOT NULL,
    code_plot character varying(50),
    distance_plot integer
);
COMMENT ON TABLE pr_monitoring_habitat_station.t_plots IS 'Placettes associées au transect';

CREATE TABLE t_releve_plots (
    id_releve_plot serial NOT NULL,
    id_plot integer NOT NULL,
    id_base_visit integer NOT NULL,
    excretes_presence boolean
);
COMMENT ON TABLE pr_monitoring_habitat_station.t_releve_plots IS 'Visites sur placette';

CREATE TABLE cor_releve_plot_strats (
    id_releve_plot_strat serial NOT NULL,
    id_releve_plot integer NOT NULL,
    id_nomenclature_strate integer NOT NULL,
    cover_pourcentage integer
);
COMMENT ON TABLE pr_monitoring_habitat_station.cor_releve_plot_strats IS 'Strates par placette';

CREATE TABLE cor_releve_plot_taxons (
    id_cor_releve_plot_taxon serial NOT NULL,
    id_releve_plot integer NOT NULL,
    id_cor_hab_taxon integer NOT NULL,
    cover_pourcentage integer
);
COMMENT ON TABLE pr_monitoring_habitat_station.cor_releve_plot_taxons IS 'Taxons observés par placette';

CREATE TABLE cor_hab_taxon (
    id_cor_hab_taxon serial NOT NULL,
    cd_nom integer NOT NULL,
    id_habitat integer NOT NULL
);
COMMENT ON TABLE pr_monitoring_habitat_station.cor_hab_taxon IS 'Liste taxons par habitat';

CREATE TABLE cor_transect_visit_perturbation (
    id_cor_transect_visit_perturb serial NOT NULL,
    id_base_visit integer NOT NULL,
    id_nomenclature_perturb integer NOT NULL
);
COMMENT ON TABLE pr_monitoring_habitat_station.cor_transect_visit_perturbation IS 'Perturbations lors visite transect';


---------------
--PRIMARY KEY--
---------------

ALTER TABLE ONLY t_transects 
    ADD CONSTRAINT pk_id_t_transects PRIMARY KEY (id_transect);

ALTER TABLE ONLY t_plots 
    ADD CONSTRAINT pk_id_t_plots PRIMARY KEY (id_plot);

ALTER TABLE ONLY t_releve_plots 
    ADD CONSTRAINT pk_id_t_releve_plots PRIMARY KEY (id_releve_plot);

ALTER TABLE ONLY cor_releve_plot_strats 
    ADD CONSTRAINT pk_id_cor_releve_plot_strats PRIMARY KEY (id_releve_plot_strat);

ALTER TABLE ONLY cor_releve_plot_taxons 
    ADD CONSTRAINT pk_id_cor_releve_plot_taxons PRIMARY KEY (id_cor_releve_plot_taxon);

ALTER TABLE ONLY cor_hab_taxon 
    ADD CONSTRAINT pk_id_cor_hab_taxon PRIMARY KEY (id_cor_hab_taxon);

ALTER TABLE ONLY cor_transect_visit_perturbation
    ADD CONSTRAINT pk_id_cor_transect_visit_perturb PRIMARY KEY (id_cor_transect_visit_perturb);

---------------
--FOREIGN KEY--
---------------
ALTER TABLE ONLY t_transects 
    ADD CONSTRAINT fk_t_transects_id_base_site FOREIGN KEY (id_base_site) REFERENCES gn_monitoring.t_base_sites (id_base_site) ON UPDATE CASCADE ON DELETE CASCADE; 
ALTER TABLE ONLY t_transects 
    ADD CONSTRAINT fk_t_transects_cd_hab FOREIGN KEY (cd_hab) REFERENCES ref_habitat.habref (cd_hab) ON UPDATE CASCADE;

ALTER TABLE ONLY t_plots 
    ADD CONSTRAINT fk_t_plots_id_transect FOREIGN KEY (id_transect) REFERENCES pr_monitoring_habitat_station.t_transects (id_transect) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY t_releve_plots 
    ADD CONSTRAINT fk_t_releve_plots_id_plot FOREIGN KEY (id_plot) REFERENCES pr_monitoring_habitat_station.t_plots (id_plot) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY t_releve_plots 
    ADD CONSTRAINT fk_t_releve_plots_id_base_visit FOREIGN KEY (id_base_visit) REFERENCES gn_monitoring.t_base_visits (id_base_visit) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY cor_releve_plot_strats 
    ADD CONSTRAINT fk_cor_releve_plot_strats_id_releve_plot FOREIGN KEY (id_releve_plot) REFERENCES pr_monitoring_habitat_station.t_releve_plots (id_releve_plot) ON UPDATE CASCADE;
ALTER TABLE ONLY cor_releve_plot_strats 
    ADD CONSTRAINT fk_cor_releve_plot_strats_id_nomenclature_strate FOREIGN KEY (id_nomenclature_strate) REFERENCES ref_nomenclatures.t_nomenclatures (id_nomenclature) ON UPDATE CASCADE;

ALTER TABLE ONLY cor_releve_plot_taxons 
    ADD CONSTRAINT fk_cor_releve_plot_taxons_id_releve_plot FOREIGN KEY (id_releve_plot) REFERENCES pr_monitoring_habitat_station.t_releve_plots (id_releve_plot) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY cor_releve_plot_taxons 
    ADD CONSTRAINT fk_cor_releve_plot_taxons_id_cor_hab_taxon FOREIGN KEY (id_cor_hab_taxon) REFERENCES pr_monitoring_habitat_station.cor_hab_taxon (id_cor_hab_taxon) ON UPDATE CASCADE;

ALTER TABLE ONLY cor_hab_taxon 
    ADD CONSTRAINT fk_cor_hab_taxon_cd_nom FOREIGN KEY (cd_nom) REFERENCES taxonomie.taxref (cd_nom) ON UPDATE CASCADE;
ALTER TABLE ONLY cor_hab_taxon 
    ADD CONSTRAINT fk_cor_hab_taxon_id_habitat FOREIGN KEY (id_habitat) REFERENCES ref_habitat.habref (cd_hab) ON UPDATE CASCADE;

ALTER TABLE ONLY cor_transect_visit_perturbation 
    ADD CONSTRAINT fk_id_base_visit FOREIGN KEY (id_base_visit) REFERENCES gn_monitoring.t_base_visits (id_base_visit) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY cor_transect_visit_perturbation 
    ADD CONSTRAINT fk_id_nomenclature_perturb FOREIGN KEY (id_nomenclature_perturb) REFERENCES ref_nomenclatures.t_nomenclatures (id_nomenclature) ON UPDATE CASCADE ON DELETE CASCADE;

----------
--UNIQUE--
----------
ALTER TABLE ONLY cor_hab_taxon
    ADD CONSTRAINT unique_cor_hab_taxon UNIQUE ( id_habitat, cd_nom );

----------
--EXPORT--
----------


