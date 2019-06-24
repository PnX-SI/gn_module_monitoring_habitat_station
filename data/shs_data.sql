
------------------------------------
-- Créer la nomenclature les strates 
------------------------------------
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (mnemonique, label_default, definition_default, label_fr, definition_fr, source)
    VALUES ('STRATE_PLACETTE', 'Strates par placette', 'Nomenclature de strates pour placette.', 'Nomenclature de strates pour placette.', 'Nomenclature de strates pour placette.', 'CBNA');
INSERT INTO ref_nomenclatures.t_nomenclatures (id_type, cd_nomenclature, mnemonique, label_default, definition_default, label_fr, definition_fr) VALUES 
(ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE'), 'Rcn', 'Recouvrement sol nu', 'Recouvrement sol nu', 'Recouvrement sol nu', 'Recouvrement sol nu', 'Recouvrement sol nu'),
(ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE'), 'Rgc', 'Recouvrement Gravier, cailloux < 10 cm', 'Recouvrement Gravier, cailloux < 10 cm', 'Recouvrement Gravier, cailloux < 10 cm', 'Recouvrement Gravier, cailloux < 10 cm', 'Recouvrement Gravier, cailloux < 10 cm'),
(ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE'), 'Rbc', 'Recouvrement Blocs/rochers', 'Recouvrement Blocs/rochers', 'Recouvrement Blocs/rochers', 'Recouvrement Blocs/rochers', 'Recouvrement Blocs/rochers'),
(ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE'), 'Rvt', 'Recouvrement Végétation total', 'Recouvrement Végétation total', 'Recouvrement Végétation total', 'Recouvrement Végétation total', 'Recouvrement Végétation total'),
(ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE'), 'Rbr', 'Recouvrement Bryophytes', 'Recouvrement Bryophytes', 'Recouvrement Bryophytes', 'Recouvrement Bryophytes', 'Recouvrement Bryophytes'),
(ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE'), 'Rdj', 'Recouvrement Déjections', 'Recouvrement Déjections', 'Recouvrement Déjections', 'Recouvrement Déjections', 'Recouvrement Déjections'),
(ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE'), 'Rpi', 'Recouvrement Piétinement', 'Recouvrement Piétinement', 'Recouvrement Piétinement', 'Recouvrement Piétinement', 'Recouvrement Piétinement'),
(ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE'), 'Rab', 'Recouvrement Abroutissement', 'Recouvrement Abroutissement', 'Recouvrement Abroutissement', 'Recouvrement Abroutissement', 'Recouvrement Abroutissement')
;

-------------------------------------------------
-- Créer la nomenclature position placette (plot) 
-------------------------------------------------
INSERT INTO ref_nomenclatures.bib_nomenclatures_types (mnemonique, label_default, definition_default, label_fr, definition_fr, source)
    VALUES ('POSITION_PLACETTE', 'Positions de placette sur un transect', 'Nomenclature de position de placette sur un transect.', 'Position de placette sur un transect', 'Position de placette sur un transect.', 'CBNA');

INSERT INTO ref_nomenclatures.t_nomenclatures (id_type, cd_nomenclature, mnemonique, label_default, definition_default, label_fr, definition_fr) VALUES 
(ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE'), 'Pha', 'Position en haut', 'Position en haut', 'Positions de placette sur un transect: Position en haut', 'Position en haut', 'Positions de placette sur un transect: Position en haut'),
(ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE'), 'Pba', 'Position en bas', 'Position en bas', 'Positions de placette sur un transect: Position en bas', 'Position en bas', 'Positions de placette sur un transect: Position en bas'),
(ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE'), 'Pdr', 'Position à droite', 'Position à droite', 'Positions de placette sur un transect: Position à droite', 'Position à droite', 'Positions de placette sur un transect: Position à droite'),
(ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE'), 'Pga', 'Position à gauche', 'Position à gauche', 'Positions de placette sur un transect: Position à gauche', 'Position à gauche', 'Positions de placette sur un transect: Position à gauche')
;

---------------------------------------------
-- Créer la nomenclature type de site habitat 
---------------------------------------------
INSERT INTO ref_nomenclatures.t_nomenclatures (id_type, cd_nomenclature, mnemonique, label_default, label_fr, definition_fr, source )
VALUES (ref_nomenclatures.get_id_nomenclature_type('TYPE_SITE'), 'HAB', 'Zone d''habitat', 'Zone d''habitat - suivi habitat', 'Zone d''habitat',  'Zone d''habitat issu des modules suivi habitat', 'CBNA');



---------------------------------
-- Insérer la liste des habitats
---------------------------------

-- insérer une liste d'habitat
INSERT INTO ref_habitat.bib_list_habitat (list_name)
VALUES ('Suivi Habitat Station');

-- Insérer habitat
INSERT INTO ref_habitat.cor_list_habitat (id_list, cd_hab)
VALUES (
    (SELECT id_list FROM ref_habitat.bib_list_habitat WHERE list_name='Suivi Habitat Station'),
16265); -- CARICION INCURVAE

----------------------
-- Insérer les sites
----------------------

-- insérer les données dans t_base_sites 
INSERT INTO gn_monitoring.t_base_sites (id_nomenclature_type_site, base_site_name, base_site_description,  base_site_code, first_use_date, geom )
VALUES (
    ref_nomenclatures.get_id_nomenclature('TYPE_SITE', 'HAB'), 'HAB-SHS-', '', 'TESTSHS1', now(),
    ST_SetSRID(ST_MakeLine(ST_MakePoint(6.7683121, 44.2840853),ST_MakePoint(6.7679639, 44.2841710)),4326)
    );


--- update le nom du site pour y ajouter l'identifiant du site ? 
--- TODO: update plus fin : ajouter une nomenclature pour SHS parente de HAB?
UPDATE gn_monitoring.t_base_sites SET base_site_name=CONCAT (base_site_name, id_base_site) WHERE base_site_name='HAB-SHS-';

-- extension de la table t_base_sites : mettre les données dans t_transect
INSERT INTO pr_monitoring_habitat_station.t_transects (id_base_site, transect_label, geom_start, geom_end, cd_hab, id_nomenclature_plot_position, plot_size)
SELECT 
	(SELECT id_base_site FROM gn_monitoring.t_base_sites WHERE base_site_code='TESTSHS1'), 
	'T1',
	ST_GeomFromText('POINT(6.7683121 44.2840853)', 4326),
	ST_GeomFromText('POINT(6.7679639 44.2841710)', 4326),
	16265,
    (SELECT id_nomenclature FROM ref_nomenclatures.t_nomenclatures WHERE id_type=ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE') AND cd_nomenclature='Pha'),
    1
;


--- Insérer les placettes

do $$
begin
for r in 1..20 loop
    INSERT INTO pr_monitoring_habitat_station.t_plots (id_transect, code_plot) VALUES
        ((SELECT id_transect FROM pr_monitoring_habitat_station.t_transects WHERE id_base_site = (SELECT id_base_site FROM gn_monitoring.t_base_sites WHERE base_site_code='TESTSHS1')),
        concat('Qu', r))
    ;
end loop;
end;
$$;


-- Insérer dans cor_site_module les sites suivis de ce module
INSERT INTO gn_monitoring.cor_site_module
WITH id_module AS(
SELECT id_module FROM gn_commons.t_modules
WHERE module_code ILIKE 'SUIVI_HAB_STA'
)
SELECT ti.id_base_site, id_module.id_module
FROM pr_monitoring_habitat_station.t_transects ti, id_module;


----------------------
-- Insérer les espèces
----------------------
-- insérer les données cor_habitat_taxon : liaison un taxon et son habitat
INSERT INTO pr_monitoring_habitat_station.cor_hab_taxon (id_habitat, cd_nom)
VALUES 
(16265, 104123),
(16265, 88386),
(16265, 88662),
(16265, 88675),
(16265, 88380),
(16265, 88360),
(16265, 127195),
(16265, 126806)
;

