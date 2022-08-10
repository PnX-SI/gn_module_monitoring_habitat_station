
Intégrer les habitats
---------------------

* Créer une liste d'habitat :

.. code:: sql

    INSERT INTO ref_habitat.bib_list_habitat (list_name)
        VALUES ('Suivi Habitat Station');

* Ajouter les habitats dans la liste :

.. code:: sql

    INSERT INTO ref_habitat.cor_list_habitat (id_list, cd_hab)
        VALUES (
        (SELECT id_list FROM ref_habitat.bib_list_habitat WHERE list_name='Suivi Habitat Station'), 16265); -- CARICION INCURVAE


Intégrer les espèces
---------------------

* Insérer les données ``pr_monitoring_habitat_station.cor_hab_taxon`` : liaison entre un taxon et son habitat :

.. code:: sql

    INSERT INTO pr_monitoring_habitat_station.cor_hab_taxon (id_habitat, cd_nom)
    VALUES
    (16265, 104123),
    (16265, 88386),
    (16265, 88662),
    (16265, 88675),
    (16265, 88380),
    (16265, 88360),
    (16265, 127195),
    (16265, 126806);


Intégrer la nomenclature  de position des placettes
---------------------------------------------------
* ATTENTION AUX DOUBLONS : Vérifier que la nomenclature de type ``POSITION_PLACETTE`` n'est pas déjà intégré

.. code:: sql

    INSERT INTO ref_nomenclatures.bib_nomenclatures_types (mnemonique, label_default, definition_default, label_fr, definition_fr, source)
        VALUES ('POSITION_PLACETTE', 'Positions de placette sur un transect', 'Nomenclature de position de placette sur un transect.', 'Position de placette sur un transect', 'Position de placette sur un transect.', 'CBNA');

    INSERT INTO ref_nomenclatures.t_nomenclatures (id_type, cd_nomenclature, mnemonique, label_default, definition_default, label_fr, definition_fr) VALUES
    (ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE'), 'Pha', 'Position en haut', 'Position en haut', 'Positions de placette sur un transect: Position en haut', 'Position en haut', 'Positions de placette sur un transect: Position en haut'),
    (ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE'), 'Pba', 'Position en bas', 'Position en bas', 'Positions de placette sur un transect: Position en bas', 'Position en bas', 'Positions de placette sur un transect: Position en bas'),
    (ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE'), 'Pdr', 'Position à droite', 'Position à droite', 'Positions de placette sur un transect: Position à droite', 'Position à droite', 'Positions de placette sur un transect: Position à droite'),
    (ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE'), 'Pga', 'Position à gauche', 'Position à gauche', 'Positions de placette sur un transect: Position à gauche', 'Position à gauche', 'Positions de placette sur un transect: Position à gauche');


Intégrer les perturbations
--------------------------
* ATTENTION AUX DOUBLONS : Vérifier que les perturbations de type ``TYPE_PERTURBATION`` ne sont pas déjà intégrées

.. code:: bash

    -- placez-vous dans le dossier du module suivi_habitat_territoire
    cp data/sht_perturbations.sql /tmp/sht_perturbations.sql
    psql -h < my_host > -U < my_user_pg >  -d < my_db_name > -f /tmp/sht_perturbations.sql &>> var/log/install_sht_perturbations.log


Intégrer les sites
-------------------
Le template du CSV pour l'insertion des sites est celui généré par l'export des visites.

* Importer le CSV dans une table temporaire de la BDD avec QGIS (``pr_monitoring_habitat_station.visits_shs_tmp`` dans cet exemple)

.. code:: sql

    INSERT INTO gn_monitoring.t_base_sites (id_nomenclature_type_site, base_site_name, base_site_description, base_site_code, first_use_date, geom )
    SELECT ref_nomenclatures.get_id_nomenclature('TYPE_SITE', 'HAB'), identifian, '', '', "date visit", geom
        FROM pr_monitoring_habitat_station.visits_shs_tmp;


Intégrer les transects
----------------------
Le template du CSV pour l'insertion des transects est celui généré par l'export des visites.

* Importer le CSV dans une table temporaire de la BDD avec QGIS (``pr_monitoring_habitat_station.visits_shs_tmp`` dans cet exemple)
* Transformer la colonne geom en Linestring si nécessaire :

.. code:: sql

    ALTER TABLE pr_monitoring_habitat_station.visits_shs_tmp
        ALTER COLUMN geom TYPE geometry(LineString, 4326)
        USING ST_GeometryN(geom, 1);


* Insérer les transects :

.. code:: sql

    INSERT INTO pr_monitoring_habitat_station.t_transects (id_base_site, transect_label, geom_start, geom_end, cd_hab, id_nomenclature_plot_position, plot_size)
    SELECT 	id_base_site,
        "label tran",
        (SELECT ST_StartPoint(vs.geom::geometry)) AS geom_start,
        (SELECT ST_EndPoint(vs.geom::geometry)) AS geom_end,
        cdhab, nm.id_nomenclature, vs."taille pla"
    FROM pr_monitoring_habitat_station.visits_shs_tmp vs
    JOIN gn_monitoring.t_base_sites bs ON vs.identifian = bs.id_base_site
    JOIN ref_nomenclatures.t_nomenclatures nm
        ON nm.id_nomenclature = (SELECT n.id_nomenclature
                                    FROM ref_nomenclatures.t_nomenclatures n
                                    WHERE n.id_type = ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE') AND vs."position p" = n.mnemonique );


* Insérer les sites suivis de ce module dans ``cor_site_application`` :

.. code:: sql

    -- Insérer dans cor_site_module les sites suivis de ce module
    INSERT INTO gn_monitoring.cor_site_module
    WITH id_module AS(
    SELECT id_module FROM gn_commons.t_modules
    WHERE module_code ILIKE 'SHS'
    )
    SELECT ti.id_base_site, id_module.id_module
    FROM pr_monitoring_habitat_station.t_transects ti, id_module;



Intégrer les placettes
----------------------

.. code:: sql

    INSERT INTO pr_monitoring_habitat_station.t_plots (id_transect, code_plot)
    SELECT DISTINCT id_transect, vs."code place"
    FROM pr_monitoring_habitat_station.visits_shs_tmp vs
    JOIN pr_monitoring_habitat_station.t_transects ts ON ts.transect_label = vs."label tran";



Intégrer les visites
--------------------

Le template du CSV pour l'insertion des visites est celui généré par l'export des visites.

* Importer le CSV dans une table temporaire de la BDD avec QGIS (``pr_monitoring_habitat_station.visits_shs_tmp`` dans cet exemple)
* Identifier les organismes présents dans les observations et intégrez ceux manquants dans UsersHub : ``SELECT DISTINCT unnest(string_to_array(organisme, ',')) AS organisme FROM pr_monitoring_habitat_territory.obs_maille_tmp ORDER BY organisme``
* Identifier les observateurs présents dans les observations et intégrez ceux manquants dans UsersHub : ``SELECT DISTINCT unnest(string_to_array(observateu, ',')) AS observateurs FROM pr_monitoring_habitat_territory.obs_maille_tmp ORDER BY observateurs``
* Remplissez la table des visites :

.. code:: sql

    INSERT INTO gn_monitoring.t_base_visits (id_base_site, visit_date_min)
    SELECT DISTINCT s.id_base_site, "date visit"::date AS date_debut
        FROM pr_monitoring_habitat_station.visits_shs_tmp vs
        JOIN gn_monitoring.t_base_sites s ON s.base_site_name = vs.identifian;


* Remplissez la table des observateurs :

.. code:: sql

    INSERT INTO gn_monitoring.cor_visit_observer
      (id_base_visit, id_role)
    WITH myuser AS(SELECT lower(unnest(string_to_array(observateu, ','))) AS obs, identifian AS name  FROM pr_monitoring_habitat_station.visits_shs_tmp),
        roles AS(SELECT lower(nom_role ||' '|| prenom_role) AS nom, id_role FROM utilisateurs.t_roles)
    SELECT DISTINCT v.id_base_visit,r.id_role
    FROM myuser m
    JOIN gn_monitoring.t_base_sites s ON s.base_site_name = m.name::text
    JOIN gn_monitoring.t_base_visits v ON v.id_base_site = s.id_base_site
    JOIN roles r ON m.obs=r.nom
    ON CONFLICT DO NOTHING;


* Remplissez la table des observations. Vérifiez que la colonne covcdnom et covstrate sontt bien au format JSON et que les clés des JSON sont entourées par des double quotes.


.. code:: sql

    -- Transformer les colonnes covcdnom et covstrate en JSON
    ALTER TABLE pr_monitoring_habitat_station.visits_shs_tmp ALTER COLUMN covcdnom TYPE json USING covcdnom::json;
    ALTER TABLE pr_monitoring_habitat_station.visits_shs_tmp ALTER COLUMN covstrate TYPE json USING covstrate::json;


.. code:: sql

    -- relevés : pr_monitoring_habitat_station.t_releve_plots
    INSERT INTO pr_monitoring_habitat_station.t_releve_plots (id_plot, id_base_visit, excretes_presence)
    SELECT p.id_plot, id_base_visit, vs."présence"
    FROM pr_monitoring_habitat_station.visits_shs_tmp vs
    JOIN gn_monitoring.t_base_sites s ON s.base_site_name = vs.identifian::text
    JOIN pr_monitoring_habitat_station.t_plots p ON p.code_plot = vs."code place"
    JOIN pr_monitoring_habitat_station.t_transects t ON t.transect_label = vs."label tran"
    JOIN gn_monitoring.t_base_visits v ON v.id_base_site = s.id_base_site;



.. code:: sql

    -- taxons : pr_monitoring_habitat_station.cor_releve_plot_taxons
    INSERT INTO pr_monitoring_habitat_station.cor_releve_plot_taxons (id_releve_plot, id_cor_hab_taxon, cover_pourcentage)
    WITH mytaxon AS( SELECT (json_each(covcdnom::json)).key AS cdnom, (json_each_text(covcdnom::json)).value AS cover_pourcentage, "label tran" AS label_trans, "code place" AS code_plot,
        identifian AS name  FROM pr_monitoring_habitat_station.visits_shs_tmp )
    SELECT DISTINCT rp.id_releve_plot, id_cor_hab_taxon, m.cover_pourcentage
    FROM mytaxon m
    JOIN pr_monitoring_habitat_station.t_plots p ON p.code_plot = m.code_plot
    JOIN pr_monitoring_habitat_station.t_releve_plots rp ON rp.id_plot = p.id_plot
    JOIN pr_monitoring_habitat_station.t_transects t ON t.transect_label = m.label_trans
    JOIN pr_monitoring_habitat_station.cor_hab_taxon ht ON ht.cd_nom = m.cdnom::int;



.. code:: sql

    -- strates : pr_monitoring_habitat_station.cor_releve_plot_strats
    INSERT INTO pr_monitoring_habitat_station.cor_releve_plot_strats (id_releve_plot, id_nomenclature_strate, cover_pourcentage)
    WITH mytaxon AS( SELECT (json_each_text(covcodestr::json)).key AS label_strate, (json_each_text(covcodestr::json)).value AS cover_pourcentage, "label tran" AS label_trans, "code place" AS code_plot,
            identifian AS name  FROM pr_monitoring_habitat_station.visits_shs_tmp )
        SELECT DISTINCT rp.id_releve_plot, nm.id_nomenclature, m.cover_pourcentage
        FROM mytaxon m
        JOIN pr_monitoring_habitat_station.t_plots p ON p.code_plot = m.code_plot
        JOIN pr_monitoring_habitat_station.t_releve_plots rp ON rp.id_plot = p.id_plot
        JOIN pr_monitoring_habitat_station.t_transects t ON t.transect_label = m.label_trans
        JOIN ref_nomenclatures.t_nomenclatures nm
            ON nm.id_nomenclature = (SELECT n.id_nomenclature
                                        FROM ref_nomenclatures.t_nomenclatures n
                                        WHERE n.id_type = ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE') AND m.label_strate = n.cd_nomenclature);



.. code:: sql

    -- perturbations : pr_monitoring_habitat_station.cor_transect_visit_perturbation-- perturbations : pr_monitoring_habitat_station.cor_transect_visit_perturbation
    INSERT INTO pr_monitoring_habitat_station.cor_transect_visit_perturbation (id_base_visit, id_nomenclature_perturb)
    WITH mypertub AS(SELECT unnest(string_to_array(perturbati, ',')) AS label_perturbation,
        identifian, "nom du sit" AS name FROM pr_monitoring_habitat_territory.obs_maille_tmp)
    SELECT DISTINCT
        v.id_base_visit,
        nm.id_nomenclature
    FROM mypertub m
    JOIN gn_monitoring.t_base_sites s ON s.base_site_name = m.name
    JOIN gn_monitoring.t_base_visits v ON v.id_base_site = s.id_base_site
    JOIN ref_nomenclatures.t_nomenclatures nm
        ON nm.id_nomenclature = (SELECT n.id_nomenclature
                                    FROM ref_nomenclatures.t_nomenclatures n
                                    WHERE n.id_type = ref_nomenclatures.get_id_nomenclature_type('TYPE_PERTURBATION') AND m.label_perturbation = n.mnemonique LIMIT 1);
