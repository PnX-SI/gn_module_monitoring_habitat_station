import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AppConfig } from '@geonature_config/app.config';

import { ModuleConfig } from '../../module.config';
import { ISite } from '../models/site.model';

@Injectable()
export class StoreService {
  public moduleConfig = ModuleConfig;
  public queryString = new HttpParams();
  public urlLoad = `${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/visits/export`;
  public currentSite: ISite;

  getCurrentSite() {
    return this.currentSite;
  }

  setCurrentSite(site: ISite) {
    this.currentSite = site;
  }
}
