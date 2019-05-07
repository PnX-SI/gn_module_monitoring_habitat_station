-- Supprimer un schéma -- 
DROP SCHEMA ref_habitat CASCADE;

DELETE FROM ref_nomenclatures.t_nomenclatures WHERE id_type=ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE') ;
