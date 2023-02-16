
# Importation de données à l'aide de script Bash

Un script Bash est disponible pour importer les données du module. Les données sources à importer doivent être fourni au format CSV (encodage UTF-8, séparateur virgule, guillemets doubles pour protéger les valeurs) :
 - habitats (`import_habitats.sh`) : CSV

Ce script est disponibles dans le dossier `bin/`.

Avant de lancer le script, il est nécessaires de correctement le paramètrer à l'aide d'un fichier `bin/config/imports_settings.ini`. Vous pouvez copier/coller le fichier `bin/config/imports_settings.sample.ini` en le renomant `imports_settings.ini`.

Dans le fichier `imports_settings.ini`, une section de paramètres concerne le script. Ces paramètres permettent entre autre d'indiquer :
 - le chemin et le nom vers le fichier source (CSV)
 - le chemin et le nom du fichier de log où les informations affichées durant son execution seront enregistrées
 - le nom des tables temporaires dans lesquelles les données sources sont stockées avant import dans les tables de GeoNature. Elles sont toutes crées dans le schema du module.
 - pour les fichiers source de type CSV, les noms des colonnes

 Enfin, pour chaque import le paramètre *import_date* doit être correctement renseigné avec une date au format `yyyy-mm-dd` distincte. Cette date permetra si nécessaire d'associer dans la base de données, les sites et visites mais aussi les utilisateurs (=`role`) et organismes à l'import courant.
 Laisser en commentaire dans le fichier `imports_settings.ini` les dates utilisées pour chaque import.
 Vous n'ête en aucun cas obligé d'utiliser la date du jour courant, vous être libre de choisir celle qui vous convient le mieux.


## Format des données
Voici le détail des champs du fichiers CSV attendus par défaut :

### Habitats (CSV)
Description des colonnes attendues dans le fichier CSV contenant la liste des habitats suivis :

 - **cd_hab** : code HabRef de l'habitat.
 - **cd_nom** : code TaxRef du nom du taxon lié à l'habitat.
 - **comment** : commentaire/note sur l'habitat et le taxon.

Paramètres présent dans le fichier de configuration:
 - **habitats_table_tmp** : nom de la table temporaire contenant les habitats créée dans Postgresql.

# Importation de données à l'aide de requêtes SQL

## Importer des sites

Le template du CSV pour l'insertion des sites est celui généré par l'export des visites.

Importer le CSV dans une table temporaire de la BDD avec QGIS (`pr_monitoring_habitat_station.tmp_visits` dans cet exemple) :

```sql

    INSERT INTO gn_monitoring.t_base_sites
        (id_nomenclature_type_site, base_site_name, base_site_description, base_site_code, first_use_date, geom )
    SELECT
        ref_nomenclatures.get_id_nomenclature('TYPE_SITE', 'HAB'), identifian, '', '', "date visit", geom
    FROM pr_monitoring_habitat_station.tmp_visits;
```

## Importer les transects

Le template du CSV pour l'insertion des transects est celui généré par l'export des visites.

Importer le CSV dans une table temporaire de la BDD avec QGIS (`pr_monitoring_habitat_station.tmp_visits` dans cet exemple)

Transformer la colonne geom en Linestring si nécessaire :

```sql
ALTER TABLE pr_monitoring_habitat_station.tmp_visits
    ALTER COLUMN geom TYPE geometry(LineString, 4326)
    USING ST_GeometryN(geom, 1);
```

Importer les transects dans `t_transects` :

```sql
INSERT INTO pr_monitoring_habitat_station.t_transects
    (id_base_site, transect_label, geom_start, geom_end, cd_hab, id_nomenclature_plot_position, plot_size)
SELECT
    id_base_site,
    "label tran",
    (SELECT ST_StartPoint(vs.geom::geometry)) AS geom_start,
    (SELECT ST_EndPoint(vs.geom::geometry)) AS geom_end,
    cdhab,
    nm.id_nomenclature,
    vs."taille pla"
FROM pr_monitoring_habitat_station.tmp_visits AS vs
    JOIN gn_monitoring.t_base_sites AS bs
        ON vs.identifian = bs.id_base_site
    JOIN ref_nomenclatures.t_nomenclatures AS nm
        ON nm.id_nomenclature = (
            SELECT n.id_nomenclature
            FROM ref_nomenclatures.t_nomenclatures n
            WHERE n.id_type = ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE')
                AND vs."position p" = n.mnemonique
        );
```

Insérer les sites suivis de ce module dans `cor_site_application` :

```sql
-- Insérer dans cor_site_module les sites suivis de ce module
INSERT INTO gn_monitoring.cor_site_module
WITH id_module AS(
SELECT id_module FROM gn_commons.t_modules
WHERE module_code ILIKE 'MHS'
)
SELECT ti.id_base_site, id_module.id_module
FROM pr_monitoring_habitat_station.t_transects ti, id_module;
```


## Importer les placettes

```sql
INSERT INTO pr_monitoring_habitat_station.t_plots
    (id_transect, code_plot)
SELECT DISTINCT id_transect, vs."code place"
FROM pr_monitoring_habitat_station.tmp_visits AS vs
JOIN pr_monitoring_habitat_station.t_transects AS ts
    ON ts.transect_label = vs."label tran";
```


## Importer les visites

Le template du CSV pour l'insertion des visites est celui généré par l'export des visites.

* Importer le CSV dans une table temporaire de la BDD avec QGIS (``pr_monitoring_habitat_station.tmp_visits`` dans cet exemple)
* Identifier les organismes présents dans les observations et intégrez ceux manquants dans UsersHub : `SELECT DISTINCT unnest(string_to_array(organisme, ',')) AS organisme FROM pr_monitoring_habitat_territory.obs_maille_tmp ORDER BY organisme`
* Identifier les observateurs présents dans les observations et intégrez ceux manquants dans UsersHub : `SELECT DISTINCT unnest(string_to_array(observateu, ',')) AS observateurs FROM pr_monitoring_habitat_territory.obs_maille_tmp ORDER BY observateurs`
* Remplissez la table des visites :

```sql
INSERT INTO gn_monitoring.t_base_visits (id_base_site, visit_date_min)
    SELECT DISTINCT s.id_base_site, "date visit"::date AS date_debut
    FROM pr_monitoring_habitat_station.tmp_visits AS vs
        JOIN gn_monitoring.t_base_sites AS s
            ON s.base_site_name = vs.identifian ;
```

* Remplissez la table des observateurs :

```sql
INSERT INTO gn_monitoring.cor_visit_observer
    (id_base_visit, id_role)
WITH myuser AS (
    SELECT
        lower(unnest(string_to_array(observateu, ','))) AS obs,
        identifian AS name
    FROM pr_monitoring_habitat_station.tmp_visits
),
roles AS (
    SELECT
        lower(nom_role ||' '|| prenom_role) AS nom,
        id_role
    FROM utilisateurs.t_roles
)
SELECT DISTINCT v.id_base_visit,r.id_role
FROM myuser AS m
    JOIN gn_monitoring.t_base_sites s
        ON s.base_site_name = m.name::text
    JOIN gn_monitoring.t_base_visits v
        ON v.id_base_site = s.id_base_site
    JOIN roles r
        ON m.obs=r.nom
ON CONFLICT DO NOTHING ;
```

* Remplissez la table des observations. Vérifiez que la colonne `covcdnom` et `covstrate` sontt bien au format JSON et que les clés des JSON sont entourées par des double quotes.

```sql
-- Transformer les colonnes covcdnom et covstrate en JSON
ALTER TABLE pr_monitoring_habitat_station.tmp_visits ALTER COLUMN covcdnom TYPE json USING covcdnom::json;
ALTER TABLE pr_monitoring_habitat_station.tmp_visits ALTER COLUMN covstrate TYPE json USING covstrate::json;
```

```sql
-- relevés : pr_monitoring_habitat_station.t_releve_plots
INSERT INTO pr_monitoring_habitat_station.t_releve_plots (id_plot, id_base_visit, excretes_presence)
SELECT p.id_plot, id_base_visit, vs."présence"
FROM pr_monitoring_habitat_station.tmp_visits AS vs
    JOIN gn_monitoring.t_base_sites AS s
        ON s.base_site_name = vs.identifian::text
    JOIN pr_monitoring_habitat_station.t_plots AS p
        ON p.code_plot = vs."code place"
    JOIN pr_monitoring_habitat_station.t_transects AS t
        ON t.transect_label = vs."label tran"
    JOIN gn_monitoring.t_base_visits AS v
        ON v.id_base_site = s.id_base_site;
```

```sql
-- taxons : pr_monitoring_habitat_station.cor_releve_plot_taxons
INSERT INTO pr_monitoring_habitat_station.cor_releve_plot_taxons
    (id_releve_plot, id_cor_hab_taxon, cover_pourcentage)
WITH mytaxon AS (
    SELECT (json_each(covcdnom::json)).key AS cdnom, (json_each_text(covcdnom::json)).value AS cover_pourcentage, "label tran" AS label_trans, "code place" AS code_plot,
    identifian AS name
    FROM pr_monitoring_habitat_station.tmp_visits
)
SELECT DISTINCT
    rp.id_releve_plot, id_cor_hab_taxon, m.cover_pourcentage
FROM mytaxon m
    JOIN pr_monitoring_habitat_station.t_plots AS p
        ON p.code_plot = m.code_plot
    JOIN pr_monitoring_habitat_station.t_releve_plots AS rp
        ON rp.id_plot = p.id_plot
    JOIN pr_monitoring_habitat_station.t_transects AS t
        ON t.transect_label = m.label_trans
    JOIN pr_monitoring_habitat_station.cor_hab_taxon AS ht
        ON ht.cd_nom = m.cdnom::int;
```

```sql
-- strates : pr_monitoring_habitat_station.cor_releve_plot_strats
INSERT INTO pr_monitoring_habitat_station.cor_releve_plot_strats
    (id_releve_plot, id_nomenclature_strate, cover_pourcentage)
WITH mytaxon AS (
    SELECT (json_each_text(covcodestr::json)).key AS label_strate, (json_each_text(covcodestr::json)).value AS cover_pourcentage, "label tran" AS label_trans, "code place" AS code_plot,
        identifian AS name
    FROM pr_monitoring_habitat_station.tmp_visits
)
SELECT DISTINCT
    rp.id_releve_plot, nm.id_nomenclature, m.cover_pourcentage
FROM mytaxon AS m
    JOIN pr_monitoring_habitat_station.t_plots AS p
        ON p.code_plot = m.code_plot
    JOIN pr_monitoring_habitat_station.t_releve_plots AS rp
        ON rp.id_plot = p.id_plot
    JOIN pr_monitoring_habitat_station.t_transects AS t
        ON t.transect_label = m.label_trans
    JOIN ref_nomenclatures.t_nomenclatures AS nm
        ON nm.id_nomenclature = (
            SELECT n.id_nomenclature
            FROM ref_nomenclatures.t_nomenclatures AS n
            WHERE n.id_type = ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE')
                AND m.label_strate = n.cd_nomenclature
        );
```

```sql
-- perturbations : pr_monitoring_habitat_station.cor_transect_visit_perturbation-- perturbations : pr_monitoring_habitat_station.cor_transect_visit_perturbation
INSERT INTO pr_monitoring_habitat_station.cor_transect_visit_perturbation
    (id_base_visit, id_nomenclature_perturb)
WITH mypertub AS (
    SELECT unnest(string_to_array(perturbati, ',')) AS label_perturbation,
    identifian, "nom du sit" AS name
    FROM pr_monitoring_habitat_territory.obs_maille_tmp
)
SELECT DISTINCT
    v.id_base_visit,
    nm.id_nomenclature
FROM mypertub AS m
    JOIN gn_monitoring.t_base_sites AS s
        ON s.base_site_name = m.name
    JOIN gn_monitoring.t_base_visits AS v
        ON v.id_base_site = s.id_base_site
    JOIN ref_nomenclatures.t_nomenclatures AS nm
        ON nm.id_nomenclature = (
            SELECT n.id_nomenclature
            FROM ref_nomenclatures.t_nomenclatures AS n
            WHERE n.id_type = ref_nomenclatures.get_id_nomenclature_type('TYPE_PERTURBATION')
                AND m.label_perturbation = n.mnemonique LIMIT 1
        );
```
