# CHANGELOG

## [Unreleased]


## [1.2.0] - 2024-08-20

### Added

- Compatibility with GeoNature 2.14
- Module permissions (CRUVED) declared in alembic branch
- Added `MODULE_DB_BRANCH` parameter in packaged module
- Added "Leaflet.Deflate" frontend dependency
- Display message when no data after filtering
- Add nomenclature "position centrée" to "position_placette" type
- ⚠️ Added new nomenclature "*Lichens*" for *STRATE_PLACETTE* nomenclature type. [#41](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/41). If module is already installed, you should run the queries in [02_migrate_v1.1.0_to_v1.2.0.sql](backend/gn_module_monitoring_habitat_station/docs/sql/02_migrate_v1.1.0_to_v1.2.0.sql).
- ⚠️ Added new nomenclature "*Position centrée*" for *POSITION_PLACETTE* nomenclature type. [#43](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/issues/43). If module is already installed, you should run the queries in [02_migrate_v1.1.0_to_v1.2.0.sql](backend/gn_module_monitoring_habitat_station/docs/sql/02_migrate_v1.1.0_to_v1.2.0.sql).

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

### ⚠️ Migrate

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
