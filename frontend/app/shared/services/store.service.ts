import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ConfigService } from '@geonature/services/config.service';
import { ISite } from '../models/site.model';

@Injectable()
export class StoreService {
  public mhsConfig = this.config['MHS'];
  public queryString = new HttpParams();
  public urlLoad = `${this.config.API_ENDPOINT}/${this.mhsConfig.MODULE_URL}/visits/export`;
  public currentSite: ISite;

  constructor(
    private config: ConfigService,
  ) { }

  getCurrentSite() {
    return this.currentSite;
  }

  setCurrentSite(site: ISite) {
    this.currentSite = site;
  }
}
