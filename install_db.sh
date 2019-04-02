#!/bin/bash

. config/settings.ini

# Create log folder in module folders if it don't already exists
if [ ! -d 'var' ]
then
  mkdir var
fi

if [ ! -d 'var/log' ]
then
  mkdir var/log
fi

###################
# ADD ref_habitat #
###################
# TODO: Version in config ?

if [ ! -d '/tmp/taxref/' ]
then
  mkdir /tmp/taxref
fi

echo "Download and extract habref file..."

  if [ ! -f '/tmp/habref/HABREF_40.zip' ]
    wget https://geonature.fr/data/inpn/habitats/HABREF_40.zip -P /tmp/habref
  then
    echo HABREF_40.zip exists
  fi
  unzip /tmp/habref/HABREF_40.zip -d /tmp/habref

cp data/habref.sql /tmp/taxref/habref.sql
cp data/habref_data.sql /tmp/taxref/habref_data.sql
cp data/habref_bib_list.sql /tmp/taxref/habref_bib_list.sql

echo "Creating 'habitat' schema..."
export PGPASSWORD=$user_pg_pass;psql -h $db_host -U $user_pg -d $db_name -f /tmp/taxref/habref.sql &>> var/log/install_habref.log
export PGPASSWORD=$user_pg_pass;psql -h $db_host -U $user_pg -d $db_name -f /tmp/taxref/habref_bib_list.sql &>> var/log/install_habref_bib_list.log

echo "Inserting INPN habitat data... "
export PGPASSWORD=$user_pg_pass;psql -h $db_host -U $user_pg -d $db_name -c "\copy ref_habitat.typoref FROM '/tmp/habref/TYPOREF_40.csv' with (format csv,header true, delimiter ';');" &>> var/log/install_typoref_data.log
export PGPASSWORD=$user_pg_pass;psql -h $db_host -U $user_pg -d $db_name -c "\copy ref_habitat.habref FROM '/tmp/habref/HABREF_40.csv' with (format csv,header true, delimiter ';');" &>> var/log/install_habref_data.log



###########
# ADD SHS #
###########

# Copy SQL files into /tmp system folder in order to edit it with variables
cp data/shs.sql /tmp/shs/shs.sql


# Create SHS schema into GeoNature database
echo "Creating 'SHS' schema... "
export PGPASSWORD=$user_pg_pass;psql -h $db_host -U $user_pg -d $db_name -f /tmp/shs/shs.sql &>> var/log/install_shs.log


if $insert_nomenclature_pert
then
    echo "Inserting perturbation ... "
    cp data/shs_perturbations.sql /tmp/shs_perturbations.sql
    export PGPASSWORD=$user_pg_pass;psql -h $db_host -U $user_pg -d $db_name -f /tmp/shs_perturbations.sql &>> var/log/install_shs_perturbations.log
fi


# Include sample data into database
#if $insert_sample_data
#then

#fi
