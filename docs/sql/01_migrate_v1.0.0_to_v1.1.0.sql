BEGIN;

ALTER TABLE pr_monitoring_habitat_station.cor_releve_plot_taxons ADD cd_nom integer NULL;

COMMENT ON COLUMN pr_monitoring_habitat_station.cor_releve_plot_taxons.cd_nom IS 'Code du nom scientifique du taxon.';

DELETE FROM pr_monitoring_habitat_station.cor_releve_plot_taxons AS crpt
WHERE crpt.cover_pourcentage IS NULL ;

UPDATE pr_monitoring_habitat_station.cor_releve_plot_taxons AS crpt
SET cd_nom = cht.cd_nom
FROM pr_monitoring_habitat_station.cor_hab_taxon AS cht
WHERE crpt.id_cor_hab_taxon = cht.id_cor_hab_taxon ;

ALTER TABLE pr_monitoring_habitat_station.cor_releve_plot_taxons ALTER COLUMN cd_nom SET NOT NULL;

ALTER TABLE pr_monitoring_habitat_station.cor_releve_plot_taxons ALTER COLUMN id_cor_hab_taxon DROP NOT NULL;

ALTER TABLE pr_monitoring_habitat_station.cor_releve_plot_taxons
ADD CONSTRAINT fk_cor_releve_plot_taxons_cd_nom
FOREIGN KEY (cd_nom)
REFERENCES taxonomie.taxref(cd_nom) ON UPDATE CASCADE ;

COMMIT;
