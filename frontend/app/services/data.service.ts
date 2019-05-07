import { Injectable, Inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { AppConfig } from "@geonature_config/app.config";
import { ModuleConfig } from "../module.config";

@Injectable()
export class DataService {

  constructor(private _http: HttpClient) { }


  getTtransectByIdSite(idSite) {
    return this._http.get(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/transects/${idSite}`)
  }

  getAllTransects(params?) {
    let myParams = new HttpParams();
    for (let key in params) {
      if(params[key])
        myParams = myParams.set(key, params[key]);
    }
    return this._http.get(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/transects`, {
      params: myParams
    })
  }

  postVisit(visit) {
    return this._http.post(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/visit`, visit)
  }

  updateVisit(visit) {
    return this._http.patch(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/update_visit/${visit.id_visit}`, visit.data)
  }

  getTaxonsByHabitat(cd_hab) {
    return this._http.get(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/habitats/${cd_hab}/taxons`)
  }

  getVisits(id_site) {
    return this._http.get(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/site/${id_site}/visits`)
  }

  getVisitByID(id_visit) {
    return this._http.get(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/visit/${id_visit}`)
  }

  getHabitatsList(id_list) {
    return this._http.get(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/habitats/${id_list}`)
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
          }
        }
      ]
    }
  }
}

export interface IVisit {
  id_base_site?: string,
  id_base_visit?: string,
  visit_date_min?: string,
  observers?: any[],
  cor_visit_perturbation?: any[],
  cor_releve_plot?: Plot[]
}

export interface Plot {
  code_plot?: string,
  id_plot?: number,
  plot_data?: PlotData,
}

export interface PlotData {
  excretes_presence?: boolean,
  taxons_releve?: any[],
  strates_releve?: any[],
}

export interface Habitat {
  cd_hab: number
  nom_habitat: string
}
