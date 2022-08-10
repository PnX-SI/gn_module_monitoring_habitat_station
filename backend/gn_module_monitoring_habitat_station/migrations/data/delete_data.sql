-----------------------------------------------------------------------------
-- Delete shs sites -- 
DELETE from gn_monitoring.t_base_sites WHERE base_site_name LIKE 'HAB-SHS-%';

-----------------------------------------------------------------------------
-- REF HABITATS
-- correspondance habitat
DELETE FROM ref_habitat.cor_list_habitat WHERE id_list IN (
    SELECT id_list FROM ref_habitat.bib_list_habitat WHERE list_name='Suivi Habitat Station'
);

DELETE FROM ref_habitats.bib_list_habitat
    WHERE list_name = 'Suivi Habitat Station';

-------------------------------------------------------------------------------
-- GN_MONITORING

-- Remove link between sites and this module
DELETE FROM gn_monitoring.cor_site_module
    WHERE id_module = (
        SELECT id_module
        FROM gn_commons.t_modules
        WHERE module_code ILIKE 'Suivi Habitat Station'
    ) ;

-------------------------------------------------------------------------------
-- GN_COMMONS

-- Unlink module from dataset
DELETE FROM gn_commons.cor_module_dataset
    WHERE id_module = (
        SELECT id_module
        FROM gn_commons.t_modules
        WHERE module_code ILIKE 'suivi_hab_sta'
    ) ;

-- Uninstall module (unlink this module of GeoNature)
DELETE FROM gn_commons.t_modules
    WHERE module_code ILIKE 'suivi_hab_sta' ;