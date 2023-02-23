import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { AppConfig } from '@geonature_config/app.config';

import { ModuleConfig } from '../../module.config';
import { IVisit } from '../models/visit.model';

@Injectable()
export class DataService {
  constructor(private _http: HttpClient) {}

  getAllTransects(params?) {
    let myParams = new HttpParams();
    for (let key in params) {
      if (params[key]) myParams = myParams.set(key, params[key]);
    }
    return this._http.get(`${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/transects`, {
      params: myParams,
    });
  }

  getOneTransect(idSite) {
    return this._http.get(
      `${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/transects/${idSite}`
    );
  }

  addTransect(transect) {
    return this._http.post(
      `${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/transects`,
      transect
    );
  }

  updateTransect(transect) {
    return this._http.patch(
      `${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/transects/${transect.id_transect}`,
      transect
    );
  }

  getAllVisits(id_site) {
    return this._http.get(
      `${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/sites/${id_site}/visits`
    );
  }

  getOneVisit(id_visit) {
    return this._http.get(`${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/visits/${id_visit}`);
  }

  addVisit(visit) {
    return this._http.post(`${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/visits`, visit);
  }

  updateVisit(visit) {
    return this._http.patch(
      `${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/visits/${visit.idVisit}`,
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

  getAllSites(params) {
    let myParams = new HttpParams();
    for (let key in params) {
      if (params[key]) myParams = myParams.set(key, params[key]);
    }
    return this._http.get(`${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/sites`, {
      params: myParams,
    });
  }

  getHabitats() {
    return this._http.get(`${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/habitats`);
  }

  getTaxonsByHabitat(cd_hab) {
    return this._http.get(
      `${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/habitats/${cd_hab}/taxons`
    );
  }

  getCurrentUserRights() {
    return this._http.get<any>(
      `${AppConfig.API_ENDPOINT}${ModuleConfig.MODULE_URL}/users/current/cruved`
    );
  }
}
