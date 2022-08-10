-- Insert habitat list_name
INSERT INTO ref_habitats.bib_list_habitat (list_name)
VALUES ('Suivi Habitat Station');

--Update module infos
UPDATE gn_commons.t_modules
SET
    module_label = 'Suivi Habitat Station',
    module_picto = 'fa-puzzle-piece',
    module_desc = 'Module de Suivi des habitats.',
    module_doc_url = 'https://github.com/PnX-SI/gn_module_suivi_habitat_station/'
WHERE module_code = 'SHS' ;