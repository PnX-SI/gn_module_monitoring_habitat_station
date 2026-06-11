import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { ConfigService } from '@geonature/services/config.service';

import { IVisit } from '../models/visit.model';

@Injectable()
export class DataService {
  constructor(
    private _http: HttpClient,
    private config: ConfigService,
  ) { }

  getAllTransects(params:any) {
    let myParams = new HttpParams();
    for (let key in params) {
      if (params[key]) myParams = myParams.set(key, params[key]);
    }
    return this._http.get(`${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/transects`, {
      params: myParams,
    });
  }

  getOneTransect(idSite:any) {
    return this._http.get(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/transects/${idSite}`
    );
  }
  getOneStation(id_station:any) {
    return this._http.get(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/stations/${id_station}`
    );
  }
  addStation(station: any) {
    return this._http.post(
        `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/stations`,
        station
    );
}

  addTransect(transect:any) {
    return this._http.post(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/transects`,
      transect
    );
  }

  updateTransect(transect:any) {
    return this._http.patch(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/transects/${transect.id_transect}`,
      transect
    );
  }

  getAllVisits(id_site:any) {
    return this._http.get(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/sites/${id_site}/visits`
    );
  }

  getOneVisit(id_visit:any) {
    return this._http.get(`${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/visits/${id_visit}`);
  }

  addVisit(visit:any) {
    return this._http.post(`${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/visits`, visit);
  }

  updateVisit(visit:any) {
    return this._http.patch(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/visits/${visit.idVisit}`,
      visit.data
    );
  }

  getDefaultVisit(): IVisit {
    return {
      id_base_visit: null,
      visit_date_min: null,
      observers: null,
      cor_visit_perturbation: null,
      cor_releve_plot: [
        {
          code_plot: null,
          id_plot: null,
          plot_data: {
            excretes_presence: null,
            taxons_releve: [],
            strates_releve: [],
          },
        },
      ],
    };
  }

  getAllSites(params:any) {
    let myParams = new HttpParams();
    for (let key in params) {
      if (params[key]) myParams = myParams.set(key, params[key]);
    }
    return this._http.get(`${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/sites`, {
      params: myParams,
    });
  }

  getHabitats() {
    return this._http.get(`${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/habitats`);
  }

  getTaxonsByHabitat(cd_hab:any) {
    return this._http.get(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/habitats/${cd_hab}/taxons`
    );
  }

  getCurrentUserRights() {
    return this._http.get<any>(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/users/current/cruved`
    );
  }
  getSensorsByTransect(id_transect:any){
    return this._http.get(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/transects/${id_transect}/sensors`
    )
  }
  getPlotByTransect(id_transect:any){
    return this._http.get(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/transects/${id_transect}/plots`
    )
  }
  addSensor(sensor:any){
    return this._http.post(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/sensors`,
      sensor
    )
  }
  updateSensor(sensor:any){
    return this._http.patch(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/sensors/${sensor.id_sensor}`, 
      sensor
    )
  }
  deleteSensor(id_sensor:any){
    return this._http.delete(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/sensors/${id_sensor}`
    )
  }
  addPlot(plot: any){
    return this._http.post(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/plots`,
      plot
    )
  }
  updatePlot(plot:any){
    return this._http.patch(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/plots/${plot.id_plot}`, 
      plot
    )
  }
  deletePlot(id_plot:any){
     return this._http.delete(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/plots/${id_plot}`
    )
  }
  getAllStations(params?: any) {
    let myParams = new HttpParams();
    for (let key in params) {
        if (params[key]) myParams = myParams.set(key, params[key]);
    }
    return this._http.get(`${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/stations`, {
        params: myParams,
    });
  }

  getTransectsByStation(id_station: number) {
      return this._http.get(
          `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/stations/${id_station}/transects`
      );
  }
  
  getStationsYears(){
    return this._http.get(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/stations/years`
    )
  }
  getStationsArea(){
    return this._http.get(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/stations/area`
    )
  }
  getOrganism(){
    return this._http.get(
      `${this.config.API_ENDPOINT}${this.config['MHS']['MODULE_URL']}/stations/organism`
    )
  }
}
