BEGIN;

INSERT INTO ref_nomenclatures.t_nomenclatures
    (id_type, cd_nomenclature, mnemonique, label_default, definition_default, label_fr, definition_fr, "hierarchy")
VALUES
	 (ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE'), 'Rli', 'Recouvrement lichens', 'Recouvrement lichens', 'Recouvrement lichens',' Recouvrement lichens', 'Recouvrement lichens', '009')
ON CONFLICT ON CONSTRAINT unique_id_type_cd_nomenclature DO NOTHING ;

COMMIT;
