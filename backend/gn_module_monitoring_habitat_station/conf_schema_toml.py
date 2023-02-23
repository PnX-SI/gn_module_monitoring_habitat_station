"""
   Spécification du schéma toml des paramètres de configurations
"""

from marshmallow import Schema, fields

export_available_format = ["geojson", "csv", "shapefile"]
site_message = {"emptyMessage": "Aucun site à afficher ", "totalMessage": "sites(s) au total"}
list_visit_message = {
    "emptyMessage": "Aucune visite sur ce site ",
    "totalMessage": "visites au total",
}
detail_list_visit_message = {
    "emptyMessage": "Aucune autre visite sur ce site ",
    "totalMessage": "visites au total",
}
default_site_columns = [
    {"name": "Identifiant", "prop": "id_base_site", "width": "90"},
    {"name": "Habitat", "prop": "nom_habitat", "width": "350"},
    {"name": "Nombre de visites", "prop": "nb_visit", "width": "120"},
    {"name": "Date de la dernière visite", "prop": "date_max", "width": "160"},
]
default_list_visit_columns = [
    {"name": "Date", "prop": "visit_date_min", "width": "120"},
    {"name": "Observateur(s)", "prop": "observers", "width": "350"},
]

class GnModuleSchemaConf(Schema):
    site_message = fields.Dict(load_default=site_message)
    list_visit_message = fields.Dict(load_default=list_visit_message)
    detail_list_visit_message = fields.Dict(load_default=detail_list_visit_message)
    export_available_format = fields.List(fields.String(), load_default=export_available_format)
    default_site_columns = fields.List(fields.Dict(), load_default=default_site_columns)
    default_list_visit_columns = fields.List(
        fields.Dict(), load_default=default_list_visit_columns
    )
    export_srid = fields.Integer(load_default=2154)
    zoom_center = fields.List(fields.Float(), load_default=[44.863664, 6.268670])
    zoom = fields.Integer(load_default=10)
    pagination_serverside = fields.Boolean(load_default=False)
    items_per_page = fields.Integer(load_default=10)
    habitat_list_name = fields.String(load_default="MHS")
    site_type_code = fields.String(load_default="HAB")
    user_list_code = fields.String(load_default="OFS")
    municipality_type_code = fields.String(load_default="COM")
