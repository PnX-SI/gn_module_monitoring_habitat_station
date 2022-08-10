-- -----------------------------------------------------------------------------
-- Set database variables

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

-- -----------------------------------------------------------------------------
-- Create SHS schema
CREATE SCHEMA pr_monitoring_habitat_station;

-- -----------------------------------------------------------------------------
-- Set new database variables
SET search_path = pr_monitoring_habitat_station, pg_catalog, public;
SET default_with_oids = false;

-- -----------------------------------------------------------------------------
-- TABLES AND SEQUENCES

-- Table `t_transects`
CREATE TABLE t_transects (
    id_transect serial NOT NULL,
    id_base_site integer NOT NULL,
    transect_label character varying(50),
    geom_start public.geometry(Point, 4326),
    geom_end public.geometry(Point, 4326),
    id_nomenclature_plot_position integer NOT NULL,
    cd_hab integer NOT NULL,
    plot_size character varying(50)
);
COMMENT ON TABLE pr_monitoring_habitat_station.t_transects IS 'Extension de t_base_sites de gn_monitoring, permet d\avoir les infos complémentaires d\un site';

-- Table `t_plots`
CREATE TABLE t_plots (
    id_plot serial NOT NULL,
    id_transect integer NOT NULL,
    code_plot character varying(50),
    distance_plot integer
);
COMMENT ON TABLE pr_monitoring_habitat_station.t_plots IS 'Placettes associées au transect';

-- Table `t_releve_plots`
CREATE TABLE t_releve_plots (
    id_releve_plot serial NOT NULL,
    id_plot integer NOT NULL,
    id_base_visit integer NOT NULL,
    excretes_presence boolean
);
COMMENT ON TABLE pr_monitoring_habitat_station.t_releve_plots IS 'Visites sur placette';

-- Table `cor_releve_plot_strats`
CREATE TABLE cor_releve_plot_strats (
    id_releve_plot_strat serial NOT NULL,
    id_releve_plot integer NOT NULL,
    id_nomenclature_strate integer NOT NULL,
    cover_pourcentage integer
);
COMMENT ON TABLE pr_monitoring_habitat_station.cor_releve_plot_strats IS 'Strates par placette';

-- Table `cor_releve_plot_taxons`
CREATE TABLE cor_releve_plot_taxons (
    id_cor_releve_plot_taxon serial NOT NULL,
    id_releve_plot integer NOT NULL,
    id_cor_hab_taxon integer NOT NULL,
    cover_pourcentage integer
);
COMMENT ON TABLE pr_monitoring_habitat_station.cor_releve_plot_taxons IS 'Taxons observés par placette';

-- Table `cor_hab_taxon`
CREATE TABLE cor_hab_taxon (
    id_cor_hab_taxon serial NOT NULL,
    cd_nom integer NOT NULL,
    id_habitat integer NOT NULL
);
COMMENT ON TABLE pr_monitoring_habitat_station.cor_hab_taxon IS 'Liste taxons par habitat';

-- Table `cor_transect_visit_perturbation`
CREATE TABLE cor_transect_visit_perturbation (
    id_cor_transect_visit_perturb serial NOT NULL,
    id_base_visit integer NOT NULL,
    id_nomenclature_perturb integer NOT NULL
);
COMMENT ON TABLE pr_monitoring_habitat_station.cor_transect_visit_perturbation IS 'Perturbations lors visite transect';


-- -----------------------------------------------------------------------------
--PRIMARY KEY

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

-- -----------------------------------------------------------------------------
--FOREIGN KEY

ALTER TABLE ONLY t_transects
    ADD CONSTRAINT fk_t_transects_id_base_site FOREIGN KEY (id_base_site) REFERENCES gn_monitoring.t_base_sites (id_base_site) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY t_transects
    ADD CONSTRAINT fk_t_transects_cd_hab FOREIGN KEY (cd_hab) REFERENCES ref_habitats.habref (cd_hab) ON UPDATE CASCADE;

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
    ADD CONSTRAINT fk_cor_hab_taxon_id_habitat FOREIGN KEY (id_habitat) REFERENCES ref_habitats.habref (cd_hab) ON UPDATE CASCADE;

ALTER TABLE ONLY cor_transect_visit_perturbation
    ADD CONSTRAINT fk_id_base_visit FOREIGN KEY (id_base_visit) REFERENCES gn_monitoring.t_base_visits (id_base_visit) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY cor_transect_visit_perturbation
    ADD CONSTRAINT fk_id_nomenclature_perturb FOREIGN KEY (id_nomenclature_perturb) REFERENCES ref_nomenclatures.t_nomenclatures (id_nomenclature) ON UPDATE CASCADE ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- UNIQUE CONSTRAINTS

ALTER TABLE ONLY cor_hab_taxon
    ADD CONSTRAINT unique_cor_hab_taxon UNIQUE ( id_habitat, cd_nom );

-- -----------------------------------------------------------------------------
-- VIEWS

-- Create view to export visits

CREATE OR REPLACE VIEW pr_monitoring_habitat_station.export_visits AS WITH
observers AS(
    SELECT
        v.id_base_visit,
        string_agg(roles.nom_role::text || ' ' ||  roles.prenom_role::text, ',') AS observateurs,
        roles.id_organisme AS organisme
    FROM gn_monitoring.t_base_visits v
    JOIN gn_monitoring.cor_visit_observer observer ON observer.id_base_visit = v.id_base_visit
    JOIN utilisateurs.t_roles roles ON roles.id_role = observer.id_role
    GROUP BY v.id_base_visit, roles.id_organisme
),
perturbations AS(
    SELECT
        v.id_base_visit,
        string_agg(n.label_default, ',') AS label_perturbation
    FROM gn_monitoring.t_base_visits v
    JOIN pr_monitoring_habitat_station.cor_transect_visit_perturbation p ON v.id_base_visit = p.id_base_visit
    JOIN ref_nomenclatures.t_nomenclatures n ON p.id_nomenclature_perturb = n.id_nomenclature
    GROUP BY v.id_base_visit
),
taxons AS (
    SELECT id_base_visit,
        id_releve_plot,
        id_plot,
        json_object_agg( lb_nom, cover_pourcentage ORDER BY lb_nom) cover_taxon,
        json_object_agg( cd_nom, cover_pourcentage ORDER BY cd_nom) cover_cdnom
    FROM (
        SELECT v.id_base_visit, tr.lb_nom, tr.cd_nom, t.cover_pourcentage, r.id_plot, r.id_releve_plot
            FROM gn_monitoring.t_base_visits v
        JOIN pr_monitoring_habitat_station.t_releve_plots r ON r.id_base_visit = v.id_base_visit
        JOIN pr_monitoring_habitat_station.cor_releve_plot_taxons t ON t.id_releve_plot = r.id_releve_plot
            JOIN pr_monitoring_habitat_station.cor_hab_taxon cht ON cht.id_cor_hab_taxon = t.id_cor_hab_taxon
        JOIN taxonomie.taxref tr ON tr.cd_nom = cht.cd_nom
            WHERE t.cover_pourcentage IS NOT NULL
            GROUP BY v.id_base_visit, tr.lb_nom, tr.cd_nom, t.cover_pourcentage, r.id_plot, r.id_releve_plot
    ) s
    GROUP BY id_base_visit, id_plot, id_releve_plot
    ORDER BY id_base_visit
),
strates AS (
    SELECT id_base_visit,
            id_releve_plot,
            id_plot,
            json_object_agg( label_default, cover_pourcentage ORDER BY label_default)  cover_strate,
            json_object_agg( cd_nomenclature, cover_pourcentage ORDER BY cd_nomenclature)  cover_code_strate
    FROM (
        SELECT v.id_base_visit, n.label_default, t.id_nomenclature_strate, t.cover_pourcentage, r.id_releve_plot, r.id_plot, cd_nomenclature
            FROM gn_monitoring.t_base_visits v
        JOIN pr_monitoring_habitat_station.t_releve_plots r ON r.id_base_visit = v.id_base_visit
            JOIN pr_monitoring_habitat_station.cor_releve_plot_strats t ON t.id_releve_plot = r.id_releve_plot
            JOIN ref_nomenclatures.t_nomenclatures n ON n.id_nomenclature = t.id_nomenclature_strate
            WHERE t.cover_pourcentage IS NOT NULL
            GROUP BY v.id_base_visit,n.label_default, t.id_nomenclature_strate,t.cover_pourcentage, r.id_releve_plot, n.cd_nomenclature
    ) s
    GROUP BY id_base_visit, id_releve_plot, id_plot
    ORDER BY id_base_visit
)

-- All the meshes of a site with their visits
SELECT sites.id_base_site AS idbsite,
	visits.id_base_visit AS idbvisit,
	visits.visit_date_min AS visitdate,
	releve.id_releve_plot AS idreleve,
	releve.excretes_presence AS crotte,
	plot.code_plot AS codeplot,
	per.label_perturbation AS lbperturb,
	obs.observateurs AS observers,
	obs.organisme,
	tax.cover_taxon AS covtaxons,
    tax.cover_cdnom AS covcdnom,
	strate.cover_strate AS covstrate,
    strate.cover_code_strate AS covcodestrate,
	habref.lb_hab_fr AS lbhab,
	habref.cd_hab,
    transect.transect_label AS transectlb,
    transect.plot_size AS plotsize,
    nomenclature.label_default AS plotpos,
    transect.geom_start,
    transect.geom_end,
    sites.geom

FROM gn_monitoring.t_base_sites sites
JOIN gn_monitoring.t_base_visits visits ON sites.id_base_site = visits.id_base_site
JOIN observers obs ON obs.id_base_visit = visits.id_base_visit
LEFT JOIN perturbations per ON per.id_base_visit = visits.id_base_visit
JOIN pr_monitoring_habitat_station.t_transects transect ON transect.id_base_site = sites.id_base_site
JOIN pr_monitoring_habitat_station.t_releve_plots releve ON releve.id_base_visit= visits.id_base_visit
LEFT JOIN taxons tax ON tax.id_releve_plot = releve.id_releve_plot
LEFT JOIN strates strate ON strate.id_releve_plot = releve.id_releve_plot
JOIN pr_monitoring_habitat_station.t_plots plot ON plot.id_plot = releve.id_plot
JOIN ref_habitats.habref habref ON habref.cd_hab = transect.cd_hab
JOIN ref_nomenclatures.t_nomenclatures nomenclature ON nomenclature.id_nomenclature = transect.id_nomenclature_plot_position
ORDER BY visits.id_base_visit;