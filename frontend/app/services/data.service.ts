import { Injectable, Inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { AppConfig } from "@geonature_config/app.config";
import { Observable } from "rxjs/Observable";

@Injectable()
export class DataService {
  constructor(private _http: HttpClient) {}

  getSites(params) {
    let mock = [
      {"totalItmes": 0, "items_per_page": 5},
      {"type": "FeatureCollection", 
        "features": [{
          "type": "Feature", 
          "id": "1", 
          "geometry": {"type": "LineString", "coordinates": [[6.7683121, 44.2840853], [6.7679639, 44.2841710]]},
          "properties": {
            "id_transect": 1, 
            "id_base_site": 1,
            "transect_label": "T1",
            "cd_hab": 16265, 
            "date_max": "2018-03-09", 
            "nom_habitat": "<em>Caricion incurvae</em> Br.-Bl. in Volk 1940", 
            "nb_visit": "1", 
            "organisme": "Autre", 
            "nom_commune": "Bayasse", 
            "base_site_code": "4033890", 
            "base_site_description": "Aucune description", 
            "base_site_name": "HABSHS-1"}
          },
          {
            "type": "Feature", 
            "id": "2", 
            "geometry": {"type": "LineString", "coordinates": [[6.7656401, 44.2873361], [6.7657098,44.2873147]]},
            "properties": {
              "id_transect": 2, 
              "id_base_site": 2,
              "transect_label": "T2",
              "cd_hab": 16265, 
              "date_max": "2018-03-09", 
              "nom_habitat": "<em>Caricion incurvae</em> Br.-Bl. in Volk 1940", 
              "nb_visit": "1", 
              "organisme": "Autre", 
              "nom_commune": "Bayasse", 
              "base_site_code": "4033890", 
              "base_site_description": "Aucune description", 
              "base_site_name": "HABSHS-2"}
            }
        ]
        }]
    return Observable.of(mock);
  }

  getSite(params) {
    let mock = {
          "id_transect": 1, 
          "id_base_site": 1,
          "transect_label": "T1",
          "geom_start": [6.7683121, 44.2840853],
          "geom_end": [6.7679639, 44.2841710],
          "position_plot": "top",
          "plot_size": 1,
          "cd_hab": 16265, 
          "date_max": "2018-03-09", 
          "nom_habitat": "<em>Caricion incurvae</em> Br.-Bl. in Volk 1940", 
          "organisme": "Autre", 
          "nom_commune": "Bayasse", 
          "base_site_code": "4033890", 
          "base_site_description": "Aucune description", 
          "base_site_name": "HABSHS-1"
  }
    return Observable.of(mock);
  }

  getVisits(params) {
    let mock = [];
    return Observable.of(mock);
  }

  getTaxons(params) {
    let mock = [];
    return Observable.of(mock);
  }

  getStrate(params) {
    let mock = [];
    return Observable.of(mock);
  }

  getOneVisit(params) {
    let mock = [];
    return Observable.of(mock);
  }

}
