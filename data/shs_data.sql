----------------------
-- Insérer geom
----------------------

-- parametrer ref_geo.bib_areas_types -- 
-- ? POLYGONE


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
SELECT (ref_nomenclatures.get_id_nomenclature_type('TYPE_SITE'), 'HAB', 'Zone d''habitat', 'Zone d''habitat - suivi habitat', 'Zone d''habitat',  'Zone d''habitat issu des modules suivi habitat', 'CBNA')
WHERE
    NOT EXISTS (
        SELECT cd_nomenclature FROM ref_nomenclatures.t_nomenclatures WHERE cd_nomenclature = 'HAB'
    );

----------------------
-- Insérer les sites
----------------------

-- insérer les données dans t_base_sites 
-- TODO: fichier geometry_tmp.shp en 2154.  
INSERT INTO gn_monitoring.t_base_sites
(id_nomenclature_type_site, base_site_name, base_site_description,  base_site_code, first_use_date, geom )
VALUES (
    ref_nomenclatures.get_id_nomenclature('TYPE_SITE', 'HAB'), 'HAB-', '', 'TESTSHS1', now(), 
geometry('0106000020E61000000100000001030000000100000015000000DA9049F027791B4050FA788B70184640ACCB7F262B791B4098AABC6F7618464028ACBD5C2E791B40C3F80B547C1846401E91F69231791B40EDB94F38821846402ECB30C934791B407E83931C88184640B4EEEA4B76791B402F679FD28718464035F122CEB7791B4069A3AA8887184640999E5950F9791B40D3A6B43E87184640BAC20FD33A7A1B4011E0BCF486184640DCC543557C7A1B40DE71C4AA8618464061C6C51E797A1B403FF780C680184640161C49E8757A1B4009853DE27A184640ED75C7B1727A1B40D885EEFD74184640FF754D7B6F7A1B408324AB196F18464039CBD4446C7A1B4096CB673569184640338DE4C22A7A1B40CDEA5F7F691846409D2E7240E9791B409B6257C96918464054467FBEA7791B403B104D136A184640EE088B3C66791B400285415D6A1846400EAB14BA24791B40705235A76A184640DA9049F027791B4050FA788B70184640')
);


--- update le nom du site pour y ajouter l'identifiant du site ? 
--- TODO: update plus fin : ajouter une nomenclature pour SHS parente de HAB?
--- UPDATE gn_monitoring.t_base_sites SET base_site_name=CONCAT (base_site_name, id_base_site) WHERE id_nomenclature_type_site= (SELECT ref_nomenclatures.get_id_nomenclature('TYPE_SITE', 'HAB'));

-- extension de la table t_base_sites : mettre les données dans t_transect
--- TODO: Utiliser fichier shape et table tmp ? 
--- TODO: Insert cd_hab
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

