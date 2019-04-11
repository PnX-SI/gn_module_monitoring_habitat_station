echo "Suppression trace module SHS dans geonature db  ... "
#psql -h localhost -p 5432 -U geonatadmin -d geonature2db -b -c "DELETE FROM gn_commons.t_modules WHERE module_code='SUIVI_HAB_STA';"
psql -h localhost -p 5432 -U geonatadmin -d geonature2db -b -c "DELETE FROM gn_monitoring.t_base_sites where base_site_code='TESTSHS1';"
psql -h localhost -p 5432 -U geonatadmin -d geonature2db -b -c "DELETE FROM ref_nomenclatures.t_nomenclatures WHERE id_nomenclature IN (SELECT id_nomenclature FROM ref_nomenclatures.t_nomenclatures WHERE id_type=ref_nomenclatures.get_id_nomenclature_type('POSITION_PLACETTE'));"
psql -h localhost -p 5432 -U geonatadmin -d geonature2db -b -c "DELETE FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique='POSITION_PLACETTE';"
psql -h localhost -p 5432 -U geonatadmin -d geonature2db -b -c "DELETE FROM ref_nomenclatures.t_nomenclatures WHERE id_nomenclature IN (SELECT id_nomenclature FROM ref_nomenclatures.t_nomenclatures WHERE id_type=ref_nomenclatures.get_id_nomenclature_type('STRATE_PLACETTE'));"
psql -h localhost -p 5432 -U geonatadmin -d geonature2db -b -c "DELETE FROM ref_nomenclatures.bib_nomenclatures_types WHERE mnemonique='STRATE_PLACETTE';"
psql -h localhost -p 5432 -U geonatadmin -d geonature2db -b -c "DROP SCHEMA pr_monitoring_habitat_station CASCADE;"

echo "Suppression trace module SHS dans dossier geonature  ... "
#rm -rf /home/celine/geonature/external_modules/suivi_hab_sta
#rm -rf /home/celine/geonature/frontend/src/external_assets/suivi_hab_sta
