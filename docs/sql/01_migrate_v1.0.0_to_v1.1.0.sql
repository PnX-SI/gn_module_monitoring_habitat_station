BEGIN;

-- ----------------------------------------------------------------------
-- Add additional taxa to the list of predefined habitat taxa

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

-- ----------------------------------------------------------------------
-- Add plot shape description field

ALTER TABLE pr_monitoring_habitat_station.t_transects ADD plot_shape text NULL;
COMMENT ON COLUMN pr_monitoring_habitat_station.t_transects.plot_shape IS 'Description de la forme des placettes.';


-- ----------------------------------------------------------------------
-- Remove nomenclatures "Position en haut", "Position en bas" and update others

DELETE FROM ref_nomenclatures.t_nomenclatures
WHERE cd_nomenclature IN ('Pha', 'Pba')
    AND id_type = ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE') ;

UPDATE ref_nomenclatures.t_nomenclatures SET
    cd_nomenclature = TRIM(cd_nomenclature),
    mnemonique = TRIM(mnemonique),
    label_default = TRIM(label_default),
    definition_default = TRIM(definition_default),
    label_fr = TRIM(label_fr),
    definition_fr = TRIM(definition_fr)
WHERE id_type = ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE')
    OR id_type = ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE') ;

UPDATE ref_nomenclatures.t_nomenclatures SET
    definition_default = 'Positions de placette sur un transect: position à droite en étant placé sur le point départ et en regardant le point d''arrivé.',
    definition_fr = 'Positions de placette sur un transect: position à droite en étant placé sur le point départ et en regardant le point d''arrivé.'
WHERE cd_nomenclature = 'Pdr'
    AND id_type = ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE') ;

UPDATE ref_nomenclatures.t_nomenclatures SET
    definition_default = 'Positions de placette sur un transect: position à gauche en étant placé sur le point départ et en regardant le point d''arrivé.',
    definition_fr = 'Positions de placette sur un transect: position à gauche en étant placé sur le point départ et en regardant le point d''arrivé.'
WHERE cd_nomenclature = 'Pga'
    AND id_type = ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE') ;


COMMIT;
