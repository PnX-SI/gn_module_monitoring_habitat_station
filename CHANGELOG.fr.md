# Changelog

Toutes les modifications notables apportées à ce projet seront documentées dans ce fichier en français.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Inédit]

## [1.3.0] - 2025-03-03

### 🔄 Modifié

L'export a été modifié [#40](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/40):
- Les noms des champs ont été modifiés : espaces remplacés par des underscores et plus d'accents.
- Le champ _Taille placette mètres_ a été renommé en _Surface en m²_.
- Les valeurs des champs `observers` et `organismes` ont été regroupés sous le champ unique `observers`.
- Les valeurs des champs booléens sont remplacés par `1` ou `0`.
- Le signe "`%`" a été retiré des valeurs des pourcentages de recouvrement.
- Le champ `Perturbation` a été renommé `Perturbations`.
- ⚠️ La vue d'export `export_visits` a été modifiée, il faut la re-créer en récupérant le code dans [schema.sql](backend/gn_module_monitoring_habitat_station/migrations/data/schema.sql#L169).

### 🗑 Supprimé

- Le champ `geom_wkt` a été retiré de l'export car il faisait doublon avec le champ `Points de départ et arrivée` (geom). [#40](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/40)

### 🐛 Corrigé

- Export au format Geojson à nouveau fonctionnel. [#40](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/40)

## [1.2.0] - 2024-08-20

### 🚀 Ajouté

- Compatibilité avec GeoNature 2.14
- Permissions de module (CRUVED) déclarées dans une branche Alembic
- Ajout du paramètre `MODULE_DB_BRANCH` pour nommer la branche Alembic
- Ajout au frontend de la dépendance `Leaflet.Deflate`
- Afficher un message lorsqu'aucune donnée n'est disponible après filtrage
- Ajout de la nomenclature "position centrée" au type "position_placette"
- ⚠️ Ajout de la nouvelle nomenclature "_Lichens_" pour le type de nomenclature _STRATE_PLACETTE_. [#41](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/41). Si le module est déjà installé, vous devez exécuter les requêtes dans [02_migrate_v1.1.0_to_v1.2.0.sql](backend/gn_module_monitoring_habitat_station/docs/sql/02_migrate_v1.1.0_to_v1.2.0.sql).
- ⚠️ Ajout d'une nouvelle nomenclature "_Position centrée_" pour le type de nomenclature _POSITION_PLACETTE_. [#43](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/43). Si le module est déjà installé, vous devez exécuter les requêtes dans [02_migrate_v1.1.0_to_v1.2.0.sql](backend/gn_module_monitoring_habitat_station/docs/sql/02_migrate_v1.1.0_to_v1.2.0.sql).

### 🔄 Modifié

- Mise à jour de `docs/install.md`
- Mise à jour des dépendances de `pyproject.toml`
- Les fonctions `check_user_cruved_visit` et `cruved_scope_for_user_in_module` sont remplacées par la classe VisitAuthMixin, qui contient des méthodes pour récupérer les droits d'utilisateur sur les données (action CRUVED + portée)
- Le paramètre de configuration `type_site_code` est renommé `site_type_code`
- Chemin modifié vers les icônes de marqueur utilisés sur la carte

### 🐛 Corrigé

- Faire fonctionner l'exportation de Shapefile si aucun chemin `dir_path` n'existe
- Faire fonctionner à nouveau l'exportation CSV
- ⚠️ Nombres décimaux autorisés pour le pourcentage de récupération des taxons sur les parcelles ; [#44](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/44). Si le module est déjà installé, vous devez exécuter les requêtes dans [02_migrate_v1.1.0_to_v1.2.0.sql](backend/gn_module_monitoring_habitat_station/docs/sql/02_migrate_v1.1.0_to_v1.2.0.sql).
- ⚠️ Mise à jour de la vue d'export des visites suite au changement sur la colonne pourcentage. Si le module est déjà installé, vous devez exécuter les requêtes dans [02_migrate_v1.1.0_to_v1.2.0.sql](backend/gn_module_monitoring_habitat_station/docs/sql/02_migrate_v1.1.0_to_v1.2.0.sql).
- Refuser l'ajout d'un taxon déjà présent dans la liste des taxons d'habitat lors de la création/modification du pourcentage de couverture de la parcelle. [#45](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/45)

## [1.1.0] - 2023-02-24

### 🚀 Ajouté

- Ajout d'un script Bash (`import_habitats.sh`) pour importer des habitats dans le module.
- Ajout de la possibilité d'ajouter un nouveau taxon à chaque relevé. [#31](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/31)
- Ajout d'un champ pour stocker des informations supplémentaires sur la position du transect et améliorer le code et le nom du site de base. [#34](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/34)
- Ajout de métadonnées par défaut pour ce module dans la base de données (voir [révision b920fc95ac59](./backend/gn_module_monitoring_habitat_station/migrations/b920fc95ac59_add_default_metadata.py)).

### 🔄 Modifié

- Au lieu de la taille de la parcelle en mètres, utilisez-la comme une surface en mètres carrés. [#32](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/32)
- Les nomenclatures _POSITION_PLACETTE_ et _STRATE_PLACETTE_ sont désormais gérées dans le module MHS. [#30](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/30)
- Mise à jour des libellés et des définitions pour les nomenclatures _STRATE_PLACETTE_, nettoyage et amélioration des nomenclatures _POSITION_PLACETTE_, voir [nomenclature.csv](./backend/gn_module_monitoring_habitat_station/migrations/data/nomenclatures.csv).
- Modification du code du module de SHS à MHS.
- Simplification de l'utilisation des paramètres de configuration entre le frontend et le backend.
- Remplacement de `setup.py` par un fichier `pyproject.toml` plus moderne.
- Mise à jour des documentations d'installation et d'importation.

### 🐛 Corrigé

- Codes utilisés à la place des identifiants (valeur des clés primaires) dans les paramètres de configuration.
- Utilisation d'un champ non vide pour les noms d'habitats afin d'éviter l'affichage de "Aucun".
- Par défaut, pour les paramètres de configuration, utilisez [METADATA_NAME](./backend/gn_module_monitoring_habitat_station/__init__.py) pour habitat_list_name et [METADATA_CODE](./backend/gn_module_monitoring_habitat_station/__init__.py) pour user_list_code.

### 🗑 Supprimé

- Les nomenclatures _bas_ et _haut_ ont été supprimées de _POSITION_PLACETTE_. [#33](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/33)

### ⚠️ Mise à niveau

Suivez l'ordre de mise à jour ci-dessous :

1. **ATTENTION** : Seulement si vous n'avez **AUCUNE DONNÉE SAISIE** dans ce module, vous pouvez réinstaller le schéma et ses données associées (métadonnées, source, liste de taxons, ...). Si vous réinstallez le module, vous n'avez pas à suivre les autres étapes. La commande pour supprimer et réinstaller le module dans la base de données : `geonature db downgrade monitoring_habitat_station@base; geonature db upgrade monitoring_habitat_station@head`
1. Dans la table `gn_commons.t_modules`, remplacez la valeur de `module_code` par "`MHS`" et la valeur de `module_path` par "`mhs`".
1. Si vous avez modifié le chemin du module :
   - Modifiez les liens symboliques dans `geonature/external_modules/` et `geonature/frontend/src/external_assets/`. Utilisez le nouveau chemin du nom du module dans le lien symbolique.
   - Avertissez GeoNature de ce changement : `geonature update-configuration --build false && geonature generate-frontend-tsconfig && geonature generate-frontend-tsconfig-app && geonature generate-frontend-modules-route`
1. Vérifiez la présence des types de nomenclature _POSITION_PLACETTE_ et _STRATE_PLACETTE_ dans la table `ref_nomenclatures.bib_nomenclatures_types` et les nomenclatures correspondantes dans `ref_nomenclatures.t_nomenclatures` (voir [révision c575c5436f6f](backend/gn_module_monitoring_habitat_station/migrations/c575c5436f6f_add_nomenclatures.py)) :
   - S'ils ne sont pas présents, exécutez la commande suivante pour mettre à jour et installer les nomenclatures : `geonature db upgrade monitoring_habitat_station@c575c5436f6f`
   - Si elles sont présentes, modifier manuellement les titres et la définition de ces nomenclatures (voir [nomenclature.csv](./backend/gn_module_monitoring_habitat_station/migrations/data/nomenclatures.csv)). Tampon de révision Alembic : `geonature db stamp c575c5436f6f`
1. Vérifiez le cadre d'acquisition, le jeu de données, la source et les fonctions utilitaires `get_dataset_id()` et `get_source_id()` pour le module MHS (voir [révision b920fc95ac59](./backend/gn_module_monitoring_habitat_station/migrations/b920fc95ac59_add_default_metadata.py)) :
   - Si présent, tamponnez la révision Alembic : `geonature db stamp b920fc95ac59`
   - Si rien n'existe ou partiellement, vous pouvez mettre à jour la base de données via la commande Alembic puis effectuer manuellement les corrections nécessaires dans votre base de données : `geonature db upgrade monitoring_habitat_station@b920fc95ac59`
1. Appliquez le script de migration SQL [01_migrate_v1.0.0_to_v1.1.0.sql](./docs/sql/01_migrate_v1.0.0_to_v1.1.0.sql): `psql -h localhost -U geonatadmin -d geonature2db -f ~/www/modules/mhs/docs/sql/01_migrate_v1.0.0_to_v1.1.0.sql`

## [1.0.0] - 2022-09-22

### 🚀 Ajouté

- Ajout du support Alembic.
- Compatibilité avec GeoNature v2.9.2.
- Ajout d'une nouvelle architecture de module ("packagée").
- Remplacer l'utilisation de l'id par le code du module.
- Mettre à jour la documentation du module.

## 🐛 Corrigé

- Mettre à jour la syntaxe pour utils-flask-sqla.
- Mettre à jour la syntaxe pour l'utilisation de Marshmallow dans le schéma de configuration.
- Changer le code du module en SHS.
- Résoudre les problèmes dus à la mise à niveau vers Angular 7.
- Nettoyer les fichiers de tâches.

## [1.0.0-rc.1] - 2019-07-30

### 🚀 Ajouté

- Première version stable. Compatibilité avec GeoNature v2.3.2.

## [0.0.1] - 2019-04-11

### 🚀 Ajouté

- Version initiale.
