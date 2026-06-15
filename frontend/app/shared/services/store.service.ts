import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ConfigService } from '@geonature/services/config.service';
import { ISite } from '../models/site.model';
import * as L from 'leaflet';

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

  buildMapLegend() {
    let div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = `
        <p><strong>Légende</strong></p>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
            <img src="./marker-icon.png" style="width:15px; height:25px;">
            <span>Station</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width:30px; height:3px; background-color:#3388ff; display:inline-block;"></div>
            <span>Transect</span>
        </div>
    `;
    return div;
  } 
  loadQueryString(){
    this.queryString = new HttpParams({
      fromString : localStorage.getItem('mhs-filters-querystring') ?? undefined
    })
  }
  saveQueryString(){
    localStorage.setItem('mhs-filters-querystring', this.queryString.toString())
  }
  clearQueryString(){
    let filterkey = this.queryString.keys();
    filterkey.forEach(key => {
      this.queryString = this.queryString.delete(key);
    })
  }
}
