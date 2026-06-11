export interface GeoPoint{
    type: string;
    coordinates:number[];
}
export interface Transect {
    id_transect: number;
    id_base_site: number;
    id_station: number;
    transect_label: string;
    geom_start: GeoPoint;
    geom_end: GeoPoint;
    nb_visits: number;
    last_visit: string;
    cd_hab: number;
    plot_size: string;
    plot_shape: string;
    azimut: number;
    id_nomenclature_plot_position: number;
}