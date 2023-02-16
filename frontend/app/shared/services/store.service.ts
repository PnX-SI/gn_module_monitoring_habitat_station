import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ModuleConfig } from '../../module.config';
import { AppConfig } from '@geonature_config/app.config';

@Injectable()
export class StoreService {
  public moduleConfig = ModuleConfig;
  public queryString = new HttpParams();
  public urlLoad = `${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/export_visit`;
  public currentSite: ISite;

  getCurrentSite() {
    return this.currentSite;
  }

  setCurrentSite(site: ISite) {
    this.currentSite = site;
  }
}

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
