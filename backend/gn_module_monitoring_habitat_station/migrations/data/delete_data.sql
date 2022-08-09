-- Supprimer shs schéma -- 
DROP SCHEMA pr_monitoring_habitat_station CASCADE;

-- Supprimer nomemclature shs-- 

DELETE FROM ref_nomenclatures.t_nomenclatures WHERE id_type=ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE') ;
DELETE FROM ref_nomenclatures.t_nomenclatures WHERE id_type=ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE');

-- Supprimer shs sites -- 
DELETE from gn_monitoring.t_base_sites where base_site_name like 'HAB-SHS-%';
---DELETE from gn_monitoring.t_base_sites where base_site_code='TESTSHS1';

-- Supprimer shs list habitat -- 
-- correspondance habitat
DELETE FROM ref_habitat.cor_list_habitat WHERE id_list IN (SELECT id_list FROM ref_habitat.bib_list_habitat WHERE list_name='Suivi Habitat Station');

--  une liste d'habitat
DELETE FROM ref_habitat.bib_list_habitat WHERE list_name='Suivi Habitat Station';