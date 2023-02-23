export interface ISite {
  geometry?: any;
  properties?: {
    id_base_site?: number;
    id_transect?: number;
    cd_hab?: number;
    organisme?: string;
    nom_habitat?: string;
    nom_commune?: string;
    plot_size?: number;
    plot_shape?: string;
    cor_plots?: any[];
    plot_position?: any;
    transect_label?: string;
    base_site_code?: string;
    base_site_description?: string;
    base_site_name?: string;
    date_max?: string;
    observers?: any[];
  };
}
