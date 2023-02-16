# CHANGELOG

## [Unreleased]

### Added

* Added Bash script (`import_habitats.sh`) to import habitats into the module.

### Changed

* Simplify used of configuration parameters between frontend and backend.
* Changed module code from SHS to MHS. Need to change module_code and module_path to "MHS" and "mhs" in gn_commons.t_modules table.
* Nomenclatures *POSITION_PLACETTE* and *STRATE_PLACETTE* are now managed in MHS module. Re-run `geonature db upgrade monitoring_habitat_station@head`.
* Cleaned and improved *POSITION_PLACETTE* and *STRATE_PLACETTE* nomenclatures.
* Updated labels and definitions for nomenclature *STRATE_PLACETTE*. Change this manually, see [nomenclature.csv](./backend/gn_module_monitoring_habitat_station/migrations/data/nomenclatures.csv).
WARNING : only if **you don't have data in module**, you can reinstall the schema :
`geonature db downgrade monitoring_habitat_station@base ; geonature db upgrade monitoring_habitat_station@head`.
* Replaced `setup.py` for a more modern `pyproject.toml` file.
* Updated installation and import documentations.

## Fixed

* Codes used instead of identifiers (primary keys value) in configuration parameters.
* Used a field not empty for habitat names to avoid "None" display.

### Removed

* Nomenclatures *bas* et *haut* were removed from *POSITION_PLACETTE*

## [1.0.0] - 2022-09-22

### Added

* Add Alembic support.
* Compatibility with GeoNature v2.9.2.
* Add new module architecture ("packaged").
* Replace use of id by code for module.
* Update module documentation.

## Fixed

* Update syntax for utils-flask-sqla.
* Update syntax for Marshmallow use in config schema.
* Change module code to SHS.
* Fix issues due to upgrade to Angular 7.
* Clean chore files.


## [1.0.0-rc.1] - 2019-07-30

### Added

* First stable version. Compatibility with GeoNature v2.3.2.

## [0.0.1] - 2019-04-11

### Added

* Initial version.
