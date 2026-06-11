# Changelog

All notable changes to this project will be documented in this file in English.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
## [2.0.0] - 2026-06-10

### 🚀 Added

- Added the concept of **station** grouping several transects (`t_stations`) with name, habitat and geometry automatically calculated as the centroid of associated transects.
- Added **temperature sensors** (`t_temperature_sensors`) associated with transects with serial number and installation date.
- Added the concept of **sub-plots** via an `id_parent` field in `t_plots` allowing a recursive plot hierarchy configurable via the `max_plot_depth` parameter.
- Added **filters** on the station list: visit year, municipality, habitat, organism.
- Added **map-list interaction**: clicking on a station in the table zooms to its transects on the map, clicking on a transect on the map highlights the corresponding row in the table with pagination management.
- Added a **map legend** indicating the symbol for stations and transects.
- Automatic display of transects on the map when zooming in beyond a certain level.
- Added configuration parameter `max_plot_depth` to limit the depth of the plot hierarchy (default: 2).
- Added backend routes: `GET /stations`, `GET /stations/years`, `GET /stations/area`, `GET /stations/organism`, `GET /stations/<id>/transects`.
- Added plot migration script (`migration_placette.sql`) to create parent plots from existing sub-plots.
- Added temperature sensor migration script (`migration_capteurs_temp.sql`).

### 🔄 Changed

- The site list has been replaced by a **station list** with an expandable table displaying associated transects (Angular Material `mat-table`).
- The transect creation/edit form now integrates management of the **station**, **sensors** and **hierarchical plots** in creation mode.
- The `cd_hab` field has been moved from `t_transects` to `t_stations` (habitat is linked to the station, not the transect).
- Station geometry is automatically recalculated after each transect is added or modified (ST_Centroid centroid of geom_start points).
- Frontend updated to use Angular Material for the station table.
- Improved plot display in the releve form with sub-plot management.

### ⚠️ Upgrade

This version introduces **non-backward-compatible** database changes. The Alembic migration `4ef2f84caba3` creates new tables and columns. In case of downgrade, data entered in the new tables (`t_stations`, `t_temperature_sensors`) and columns (`id_parent`, `id_station`, `azimut`) will be **lost**.

1. Apply the Alembic migration with the `by_label` tag (CBNA convention):
   `geonature db upgrade monitoring_habitat_station@head --tag by_label`
2. Apply the plot migration script:
   `psql -h localhost -U geonatadmin -d geonature2db -f migration_placette.sql`
3. Apply the temperature sensor migration script:
   `psql -h localhost -U geonatadmin -d geonature2db -f migration_capteurs_temp.sql`

## [1.3.0] - 2025-03-03

### 🔄 Modified

The export has been modified [#40](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/40):
- Field names have been modified: spaces replaced by underscores and no more accents.
- The _Plot size meters_ field has been renamed to _Area in m²_.
- The values of the `observers` and `organisms` fields have been grouped together under the single `observers` field.
- Boolean field values have been replaced by `1` or `0`.
- The `%` sign has been removed from percent overlap values.
- The `Perturbation` field has been renamed `Perturbations`.
- ⚠️ The `export_visits` export view has been modified, it must be re-created by retrieving the code from [schema.sql](backend/gn_module_monitoring_habitat_station/migrations/data/schema.sql#L169).

### 🗑 Removed

- The `geom_wkt` field has been removed from the export as it duplicated the `Start and end points (geom)` field. [#40](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/40)

### 🐛 Fixed

- Geojson export is working again. [#40](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/40)


## [1.2.0] - 2024-08-20

### Added

- Compatibility with GeoNature 2.14
- Module permissions (CRUVED) declared in alembic branch
- Added `MODULE_DB_BRANCH` parameter in packaged module
- Added "Leaflet.Deflate" frontend dependency
- Display message when no data after filtering
- Add nomenclature "position centrée" to "position_placette" type
- ⚠️ Added new nomenclature "_Lichens_" for _STRATE_PLACETTE_ nomenclature type. [#41](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/41). If module is already installed, you should run the queries in [02_migrate_v1.1.0_to_v1.2.0.sql](backend/gn_module_monitoring_habitat_station/docs/sql/02_migrate_v1.1.0_to_v1.2.0.sql).
- ⚠️ Added new nomenclature "_Position centrée_" for _POSITION_PLACETTE_ nomenclature type. [#43](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/43). If module is already installed, you should run the queries in [02_migrate_v1.1.0_to_v1.2.0.sql](backend/gn_module_monitoring_habitat_station/docs/sql/02_migrate_v1.1.0_to_v1.2.0.sql).

### Changed

- Updated `docs/install.md`
- Updated `pyproject.toml` dependecies
- The check_user_cruved_visit and cruved_scope_for_user_in_module functions are replaced by the VisitAuthMixin class, which contains methods for retrieving user rights on data (CRUVED action + scope)
- The config parameter `type_site_code` is renamed `site_type_code`
- Changed path to marker icons

### Fixed

- Make shapefile export work if no dir_path exists
- Make csv export work again
- ⚠️ Allowed decimal numbers for recovery percentage of taxons on plots; [#44](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/44). If module is already installed, you should run the queries in [02_migrate_v1.1.0_to_v1.2.0.sql](backend/gn_module_monitoring_habitat_station/docs/sql/02_migrate_v1.1.0_to_v1.2.0.sql).
- ⚠️ Update of visits export view due to change on percentage column. If module is already installed, you should run the queries in [02_migrate_v1.1.0_to_v1.2.0.sql](backend/gn_module_monitoring_habitat_station/docs/sql/02_migrate_v1.1.0_to_v1.2.0.sql).
- Deny adding a taxon already in habitat taxon list when creating/editing plot cover percentage. [#45](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/45)

## [1.1.0] - 2023-02-24

### Added

- Added Bash script (`import_habitats.sh`) to import habitats into the module.
- Added possibility to add new taxon to each releve. [#31](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/31)
- Added field to store additional transect position infos and improve base site code and name. [#34](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/34)
- Add default metadata for this module in database (see [revision b920fc95ac59](./backend/gn_module_monitoring_habitat_station/migrations/b920fc95ac59_add_default_metadata.py)).

### Changed

- Instead of the plot size in meters, use it as an area with square meters. [#32](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/32)
- Nomenclatures _POSITION_PLACETTE_ and _STRATE_PLACETTE_ are now managed in MHS module. [#30](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/30)
- Updated labels and definitions for _STRATE_PLACETTE_ nomenclatures, cleaned and improved _POSITION_PLACETTE_ nomenclatures, see [nomenclature.csv](./backend/gn_module_monitoring_habitat_station/migrations/data/nomenclatures.csv).
- Changed module code from SHS to MHS.
- Simplify used of configuration parameters between frontend and backend.
- Replaced `setup.py` for a more modern `pyproject.toml` file.
- Updated installation and import documentations.

### Fixed

- Codes used instead of identifiers (primary keys value) in configuration parameters.
- Used a field not empty for habitat names to avoid "None" display.
- By default, for configuration parameters, use [METADATA_NAME](./backend/gn_module_monitoring_habitat_station/__init__.py) for habitat_list_name and [METADATA_CODE](./backend/gn_module_monitoring_habitat_station/__init__.py) for user_list_code.

### Removed

- Nomenclatures _bas_ et _haut_ were removed from _POSITION_PLACETTE_. [#33](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/33)

### ⚠️ Upgrade

Follow the update order below:

1. **ATTENTION**: Only if you **HAVE NO DATA ENTERED** in this module, you can reinstall the schema and its associated data (metadata, source, taxon list, ...). If you reinstall the module, you don't have to follow the other steps. The command to delete and reinstall the module in the database: `geonature db downgrade monitoring_habitat_station@base; geonature db upgrade monitoring_habitat_station@head`
1. In the `gn_commons.t_modules table`, replace the value of `module_code` with "`MHS`" and the value of `module_path` with "`mhs`".
1. If you have changed the path of the module:
   - Change symbolic links in `geonature/external_modules/` and `geonature/frontend/src/external_assets/`. Use new module name path in symbolic link.
   - Notify GeoNature of this change: `geonature update-configuration --build false && geonature generate-frontend-tsconfig && geonature generate-frontend-tsconfig-app && geonature generate-frontend-modules-route`
1. Check the presence of _POSITION_PLACETTE_ and _STRATE_PLACETTE_ nomenclature types in the `ref_nomenclatures.bib_nomenclatures_types` table and the corresponding nomenclatures in `ref_nomenclatures.t_nomenclatures` (see [revision c575c5436f6f](backend/gn_module_monitoring_habitat_station/migrations/c575c5436f6f_add_nomenclatures.py)):
   - If they are not present, run the following command to update and install the nomenclatures: `geonature db upgrade monitoring_habitat_station@c575c5436f6f`
   - If they are present, manually modify the titles and definition of these nomenclatures (see [nomenclature.csv](./backend/gn_module_monitoring_habitat_station/migrations/data/nomenclatures.csv)). Stamp Alembic revision: `geonature db stamp c575c5436f6f`
1. Check for acquisition framework, dataset, source and utility functions `get_dataset_id()` and `get_source_id()` for MHS module (see [revision b920fc95ac59](./backend/gn_module_monitoring_habitat_station/migrations/b920fc95ac59_add_default_metadata.py)):
   - If present, stamp the Alembic revision: `geonature db stamp b920fc95ac59`
   - If nothing exists or partially, you can update the database via the Alembic command then manually make the necessary corrections in your database: `geonature db upgrade monitoring_habitat_station@b920fc95ac59`
1. Apply the SQL migration script [01_migrate_v1.0.0_to_v1.1.0.sql](./docs/sql/01_migrate_v1.0.0_to_v1.1.0.sql): `psql -h localhost -U geonatadmin -d geonature2db -f ~/www/modules/mhs/docs/sql/01_migrate_v1.0.0_to_v1.1.0.sql`

## [1.0.0] - 2022-09-22

### Added

- Add Alembic support.
- Compatibility with GeoNature v2.9.2.
- Add new module architecture ("packaged").
- Replace use of id by code for module.
- Update module documentation.

## Fixed

- Update syntax for utils-flask-sqla.
- Update syntax for Marshmallow use in config schema.
- Change module code to SHS.
- Fix issues due to upgrade to Angular 7.
- Clean chore files.

## [1.0.0-rc.1] - 2019-07-30

### Added

- First stable version. Compatibility with GeoNature v2.3.2.

## [0.0.1] - 2019-04-11

### Added

- Initial version.
