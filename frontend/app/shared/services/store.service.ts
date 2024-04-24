import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ConfigService } from '@geonature/services/config.service';
import { ISite } from '../models/site.model';

@Injectable()
export class StoreService {
  public mhsConfig: any = {};
  public queryString = new HttpParams();
  public currentSite: ISite;
  public urlLoad: string;

  constructor(
    private config: ConfigService,
  ) {
    this.mhsConfig = this.config['MHS'];
    this.urlLoad = `${this.config.API_ENDPOINT}/${this.mhsConfig.MODULE_URL}/visits/export`;
  }

  getCurrentSite() {
    return this.currentSite;
  }

  setCurrentSite(site: ISite) {
    this.currentSite = site;
  }
}
