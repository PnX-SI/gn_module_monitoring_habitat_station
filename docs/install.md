# Installation/Désinstallation du module

## Prérequis

- Avoir [installé GeoNature](https://github.com/PnX-SI/GeoNature) en version v2.14.2 ou plus.

## Installation

### Installation en production

1. Téléchargez le module sur votre serveur [à partir d'une release](https://github.com/PnX-SI/gn_module_monitoring_habitat_station/releases) :
```bash
    wget https://github.com/PnX-SI/gn_module_monitoring_habitat_station/archive/X.Y.Z.zip
```
2. Créez un dossier qui contiendra vos modules :
```bash
    mkdir /home/${USER}/modules
```
3. Dézippez dans `/home/${USER}/modules` avec :
```bash
    unzip X.Y.Z.zip
```
4. Placez-vous dans le dossier de GeoNature et activez le venv :
```bash
    source backend/venv/bin/activate
```
5. Installez le module avec la commande :
```bash
    geonature install-gn-module /home/${USER}/modules/gn_module_monitoring_habitat_station
```
    - Adaptez le chemin `/home/${USER}/modules/gn_module_monitoring_habitat_station` à votre installation.
6. Appliquez la migration de base de données avec le tag approprié :
```bash
    geonature db upgrade monitoring_habitat_station@head --tag by_label
```
    - Le tag `by_label` regroupe les transects en stations selon leur label (convention CBNA).
    - Sans tag, les transects sont regroupés par proximité géographique (ST_ClusterDBSCAN).
7. Complétez la configuration du module uniquement si nécessaire :
```bash
    nano config/conf_gn_module.toml
```
    - Vous trouverez les paramètres possibles dans le fichier : `config/conf_gn_module.toml.example`.
    - Les valeurs par défaut dans : `backend/gn_module_monitoring_habitat_station/conf_schema_toml.py`
8. Vous pouvez sortir du venv en lançant la commande : `deactivate`

### Installation en développement

* Cloner le module avec le protocole SSH : `git clone git@github.com:PnX-SI/gn_module_monitoring_habitat_station.git`
* Placez-vous dans le dossier de GeoNature et activez le *venv* : `source backend/venv/bin/activate`
* Installez le module dans GeoNature avec la commande :
```bash
    geonature install-gn-module --build false /home/${USER}/modules/gn_module_monitoring_habitat_station
```
* Appliquez la migration de base de données :
```bash
    geonature db upgrade monitoring_habitat_station@head --tag by_label
```
* Complétez la configuration du module uniquement si nécessaire :
```bash
    nano config/conf_gn_module.toml
```
* Vous pouvez sortir du venv en lançant la commande : `deactivate`

## Désinstallation

**⚠️ ATTENTION :** la désinstallation du module implique la suppression de toutes les données associées. Assurez vous d'avoir fait une sauvegarde de votre base de données au préalable.

Suivez la procédure suivante :
1. Rétrograder la base de données pour y enlever les données spécifiques au module :
```bash
    geonature db downgrade monitoring_habitat_station@base
```
2. Désinstaller le package du virtual env :
```bash
    pip uninstall gn-module-monitoring-habitat-station
```
    - Possibilité de voir le nom du module avec : `pip list`
3. Supprimer la ligne relative au module dans `gn_commons.t_modules`
4. Supprimer le lien symbolique du module dans le dossier :
    - `geonature/frontend/external_modules/`