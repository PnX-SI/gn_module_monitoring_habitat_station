---------------------------------
-- Insérer la liste des habitats
---------------------------------

-- insérer une liste d'habitat
INSERT INTO ref_habitats.bib_list_habitat (list_name)
VALUES ('Suivi Habitat Station');

-- Insérer habitat
INSERT INTO ref_habitats.cor_list_habitat (id_list, cd_hab)
VALUES (
    (SELECT id_list FROM ref_habitats.bib_list_habitat 
        WHERE list_name='Suivi Habitat Station'),
    16265
); -- CARICION INCURVAE


