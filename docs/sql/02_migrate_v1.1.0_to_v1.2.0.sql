BEGIN;

INSERT INTO ref_nomenclatures.t_nomenclatures
    (id_type, cd_nomenclature, mnemonique, label_default, definition_default, label_fr, definition_fr, "hierarchy")
VALUES
	 (ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE'), 'Rli', 'Recouvrement lichens', 'Recouvrement lichens', 'Recouvrement lichens',' Recouvrement lichens', 'Recouvrement lichens', '009')
ON CONFLICT ON CONSTRAINT unique_id_type_cd_nomenclature DO NOTHING ;

-- Drop view that uses 'cor_releve_plot_taxons.cover_pourcentage' value before changing the type of
-- this column to not throw "ERROR : cannot modify the type of a column used in a view or rule"

DROP VIEW pr_monitoring_habitat_station.export_visits;

ALTER TABLE pr_monitoring_habitat_station.cor_releve_plot_taxons ALTER COLUMN cover_pourcentage TYPE float4 USING cover_pourcentage::float4;

CREATE OR REPLACE VIEW pr_monitoring_habitat_station.export_visits AS
WITH observers AS (
    SELECT
        v.id_base_visit,
        string_agg(roles.nom_role::text || ' ' ||  roles.prenom_role::text, ',') AS observateurs,
        roles.id_organisme AS organisme
    FROM gn_monitoring.t_base_visits AS v
        JOIN gn_monitoring.cor_visit_observer AS observer
            ON observer.id_base_visit = v.id_base_visit
        JOIN utilisateurs.t_roles AS roles
            ON roles.id_role = observer.id_role
    GROUP BY v.id_base_visit, roles.id_organisme
),
perturbations AS (
    SELECT
        v.id_base_visit,
        string_agg(n.label_default, ',') AS label_perturbation
    FROM gn_monitoring.t_base_visits AS v
        JOIN pr_monitoring_habitat_station.cor_transect_visit_perturbation AS p
            ON v.id_base_visit = p.id_base_visit
        JOIN ref_nomenclatures.t_nomenclatures AS n
            ON p.id_nomenclature_perturb = n.id_nomenclature
    GROUP BY v.id_base_visit
),
taxons AS (
    SELECT
        id_base_visit,
        id_releve_plot,
        id_plot,
        json_object_agg( lb_nom, cover_pourcentage ORDER BY lb_nom) cover_taxon,
        json_object_agg( cd_nom, cover_pourcentage ORDER BY cd_nom) cover_cdnom
    FROM (
        SELECT
            v.id_base_visit,
            tr.lb_nom,
            tr.cd_nom,
            t.cover_pourcentage,
            r.id_plot,
            r.id_releve_plot
        FROM gn_monitoring.t_base_visits AS v
            JOIN pr_monitoring_habitat_station.t_releve_plots AS r
                ON r.id_base_visit = v.id_base_visit
            JOIN pr_monitoring_habitat_station.cor_releve_plot_taxons AS t
                ON t.id_releve_plot = r.id_releve_plot
            JOIN pr_monitoring_habitat_station.cor_hab_taxon AS cht
                ON cht.id_cor_hab_taxon = t.id_cor_hab_taxon
            JOIN taxonomie.taxref AS tr
                ON tr.cd_nom = cht.cd_nom
        WHERE t.cover_pourcentage IS NOT NULL
        GROUP BY v.id_base_visit, tr.lb_nom, tr.cd_nom, t.cover_pourcentage, r.id_plot, r.id_releve_plot
    ) AS s
    GROUP BY id_base_visit, id_plot, id_releve_plot
    ORDER BY id_base_visit
),
strates AS (
    SELECT
        id_base_visit,
        id_releve_plot,
        id_plot,
        json_object_agg( label_default, cover_pourcentage ORDER BY label_default)  cover_strate,
        json_object_agg( cd_nomenclature, cover_pourcentage ORDER BY cd_nomenclature)  cover_code_strate
    FROM (
        SELECT
            v.id_base_visit,
            n.label_default,
            t.id_nomenclature_strate,
            t.cover_pourcentage,
            r.id_releve_plot,
            r.id_plot,
            cd_nomenclature
        FROM gn_monitoring.t_base_visits AS v
            JOIN pr_monitoring_habitat_station.t_releve_plots AS r
                ON r.id_base_visit = v.id_base_visit
            JOIN pr_monitoring_habitat_station.cor_releve_plot_strats AS t
                ON t.id_releve_plot = r.id_releve_plot
            JOIN ref_nomenclatures.t_nomenclatures AS n
                ON n.id_nomenclature = t.id_nomenclature_strate
        WHERE t.cover_pourcentage IS NOT NULL
        GROUP BY v.id_base_visit, n.label_default, t.id_nomenclature_strate,t.cover_pourcentage, r.id_releve_plot, n.cd_nomenclature
    ) AS s
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
FROM gn_monitoring.t_base_sites AS sites
    JOIN gn_monitoring.t_base_visits AS visits
        ON sites.id_base_site = visits.id_base_site
    JOIN observers AS obs
        ON obs.id_base_visit = visits.id_base_visit
    LEFT JOIN perturbations AS per
        ON per.id_base_visit = visits.id_base_visit
    JOIN pr_monitoring_habitat_station.t_transects AS transect
        ON transect.id_base_site = sites.id_base_site
    JOIN pr_monitoring_habitat_station.t_releve_plots AS releve
        ON releve.id_base_visit = visits.id_base_visit
    LEFT JOIN taxons AS tax
        ON tax.id_releve_plot = releve.id_releve_plot
    LEFT JOIN strates AS strate
        ON strate.id_releve_plot = releve.id_releve_plot
    JOIN pr_monitoring_habitat_station.t_plots AS plot
        ON plot.id_plot = releve.id_plot
    JOIN ref_habitats.habref AS habref
        ON habref.cd_hab = transect.cd_hab
    JOIN ref_nomenclatures.t_nomenclatures AS nomenclature
        ON nomenclature.id_nomenclature = transect.id_nomenclature_plot_position
ORDER BY visits.id_base_visit;

COMMIT;
