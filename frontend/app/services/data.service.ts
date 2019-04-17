import { Injectable, Inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { AppConfig } from "@geonature_config/app.config";
import { ModuleConfig } from "../module.config";
import { Observable } from "rxjs/Observable";

@Injectable()
export class DataService {
  constructor(private _http: HttpClient) { }

  getSites(params) {
    let mock = [{
      "totalItmes": 0,
      "items_per_page": 5
    },
    {
      "type": "FeatureCollection",
      "features": [{
        "type": "Feature",
        "id": "1",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [6.7683121, 44.2840853],
            [6.7679639, 44.2841710]
          ]
        },
        "properties": {
          "id_transect": 1,
          "id_base_site": 1,
          "transect_label": "T1",
          "cd_hab": 16265,
          "date_max": "2018-03-09",
          "nom_habitat": "<em>Caricion incurvae</em> Br.-Bl. in Volk 1940",
          "nb_visit": "1",
          "organisme": "Autre",
          "observers": [{
            "nom_role": "Nom-agent1",
            "prenom_role": "Prénom-agent1"
          }],
          "nom_commune": "Bayasse",
          "base_site_code": "4033890",
          "base_site_description": "Aucune description",
          "base_site_name": "HABSHS-1"
        }
      },
      {
        "type": "Feature",
        "id": "2",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [6.7656401, 44.2873361],
            [6.7657098, 44.2873147]
          ]
        },
        "properties": {
          "id_transect": 2,
          "id_base_site": 2,
          "transect_label": "T2",
          "cd_hab": 16265,
          "date_max": "2018-03-09",
          "nom_habitat": "<em>Caricion incurvae</em> Br.-Bl. in Volk 1940",
          "nb_visit": "1",
          "organisme": "Autre",
          "observers": [{
            "nom_role": "Nom-agent1",
            "prenom_role": "Prénom-agent1"
          }],
          "nom_commune": "Bayasse",
          "base_site_code": "4033890",
          "base_site_description": "Aucune description",
          "base_site_name": "HABSHS-2"
        }
      }
      ]
    }
    ]
    return Observable.of(mock);
  }
  getSiteByID(idSite) {
    return this._http.get(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/site/${idSite}`)
  }
  getAllSites() {
    return this._http.get(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/sites`)
  }

  postVisit(visit) {
    return this._http.post(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/visit`,visit)
  }
  
  getTaxonsByHabitat(cd_hab) {
    return this._http.get(`${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/habitats/${cd_hab}/taxons`)
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
      "observers": [{
        "nom_role": "Nom-agent1",
        "prenom_role": "Prénom-agent1"
      }],
      "nom_commune": "Bayasse",
      "base_site_code": "4033890",
      "base_site_description": "Aucune description",
      "base_site_name": "HABSHS-1",
      "plots": [{
        "code_plot": "124A",
        "id_plot": 124
      }, {
        "code_plot": "125A",
        "id_plot": 125
      }, {
        "code_plot": "126A",
        "id_plot": 126,

      }, {
        "code_plot": "127A",
        "id_plot": 127
      }]
    }
    return Observable.of(mock);
  }

  getVisits(params) {
    let mock = [{
      "id_transect": 1,
      "transect_label": "T1",
      "id_base_site": 1,
      "id_base_visit": 1,
      "visit_date_min": "2018-03-09",
      "observers": [{
        "id_menu": 1,
        "id_role": 4,
        "nom_complet": "PAUL Pierre",
        "nom_role": "Paul",
        "prenom_role": "Pierre"
      }],
      "cor_transect_visit_perturbation": [{
        "id_base_visit": 2,
        "id_nomenclature_perturbation": 499,
        "create_date": "2019-03-04 18:37:30.461149",
        "t_nomenclature": {
          "id_nomenclature": 499,
          "mnemonique": "Activit\u00e9s foresti\u00e8res",
          "label_default": "Activit\u00e9s foresti\u00e8res"
        }
      }],
      "excretes_presence": true,
      "plots": [{
        "code_plot": "124A",
        "id_plot": 124
      }, {
        "code_plot": "125A",
        "id_plot": 125
      }, {
        "code_plot": "126A",
        "id_plot": 126
      }, {
        "code_plot": "127A",
        "id_plot": 127
      }]
    }];
    return Observable.of(mock);
  }

  getTaxons(params) {
    let mock = [{
      "id_cor_hab_taxon": "104123",
      "nom_complet": "Juncus arcticus Willd., 1799"
    }, {
      "id_cor_hab_taxon": "88386",
      "nom_complet": "Carex bipartita Bellardi ex All., 1785"
    }, {
      "id_cor_hab_taxon": "88662",
      "nom_complet": "Carex maritima Gunnerus, 1772"
    }, {
      "id_cor_hab_taxon": "88675",
      "nom_complet": "Carex microglochin Wahlenb., 1803"
    }, {
      "id_cor_hab_taxon": "88380",
      "nom_complet": "Carex bicolor All., 1785"
    }, {
      "id_cor_hab_taxon": "88360",
      "nom_complet": "Carex atrofusca Schkuhr, 1801"
    }, {
      "id_cor_hab_taxon": "127195",
      "nom_complet": "Trichophorum pumilum (Vahl) Schinz & Thell., 1921"
    }, {
      "id_cor_hab_taxon": "126806",
      "nom_complet": "Tofieldia pusilla (Michx.) Pers., 1805"
    }];
    return Observable.of(mock);
  }

  getStrates() {
    let mock = [{
      "id_nomenclature_strate": 499,
      "mnemonique": "Activit\u00e9s foresti\u00e8res",
      "label_default": "Activit\u00e9s foresti\u00e8res"
    }];
    return Observable.of(mock);
  }

  getOneVisit(params) {
    let mock = {
      "id_transect": 1,
      "transect_label": "T1",
      "id_base_site": 1,
      "id_base_visit": 1,
      "visit_date_min": "2018-03-09",
      "observers": [{
        "id_menu": 1,
        "id_role": 4,
        "nom_complet": "PAUL Pierre",
        "nom_role": "Paul",
        "prenom_role": "Pierre",
        "id_organisme": -1,
        "groupe": false,
        "identifiant": "pierre.paul"
      }],
      "cor_transect_visit_perturbation": [{
        "id_base_visit": 2,
        "id_nomenclature_perturbation": 499,
        "create_date": "2019-03-04 18:37:30.461149",
        "t_nomenclature": {
          "id_nomenclature": 499,
          "mnemonique": "Activit\u00e9s foresti\u00e8res",
          "label_default": "Activit\u00e9s foresti\u00e8res"
        }
      }],
      "plots": [{
        "code_plot": "124A",
        "id_plot": 124,
        "plot_data": {
          "excretes_presence": true,
          "strates_releve": [{
            "id_base_visit": 2,
            "id_nomenclature_strate": 499,
            // "label_strate"
            "cover_pourcentage": 100,
            "create_date": "2019-03-04 18:37:30.461149",
            "t_nomenclature": {
              "id_nomenclature": 499,
              "mnemonique": "Activit\u00e9s foresti\u00e8res",
              "label_default": "Activit\u00e9s foresti\u00e8res"
            }
          }],
          "taxons_releve": [{
            "id_cor_hab_taxon": 180,
            "cover_pourcentage": 0,
            "id_cor_hab_taxon": 104123,
            "nom_complet": "Juncus arcticus Willd., 1799"
          }, {
            "id_cor_hab_taxon": 182,
            "cover_pourcentage": 10,
            "id_cor_hab_taxon": 88675,
            "nom_complet": "Carex microglochin Wahlenb., 1803"
          }, {
            "id_cor_hab_taxon": 183,
            "cover_pourcentage": 15,
            "id_cor_hab_taxon": 88662,
            "nom_complet": "Carex maritima Gunnerus, 1772"
          }, {
            "id_cor_hab_taxon": 184,
            "cover_pourcentage": 15,
            "id_cor_hab_taxon": 88380,
            "nom_complet": "Carex bicolor All., 1785"
          }, {
            "id_cor_hab_taxon": 185,
            "cover_pourcentage": 20,
            "id_cor_hab_taxon": 88360,
            "nom_complet": "Carex atrofusca Schkuhr, 1801"
          }, {
            "id_cor_hab_taxon": 186,
            "cover_pourcentage": 10,
            "id_cor_hab_taxon": 127195,
            "nom_complet": "Trichophorum pumilum (Vahl) Schinz & Thell., 1921"
          }, {
            "id_cor_hab_taxon": 183,
            "cover_pourcentage": 30,
            "id_cor_hab_taxon": 126806,
            "nom_complet": "Tofieldia pusilla (Michx.) Pers., 1805"
          }]
        }
      }, {
        "code_plot": "125A",
        "id_plot": 125,
        "plot_data": {
          "excretes_presence": true,
          "strates_releve": [{
            "id_base_visit": 2,
            "id_nomenclature_strate": 499,
            "cover_pourcentage": 100,
            "create_date": "2019-03-04 18:37:30.461149",
            "t_nomenclature": {
              "id_nomenclature": 499,
              "mnemonique": "Activit\u00e9s foresti\u00e8res",
              "label_default": "Activit\u00e9s foresti\u00e8res"
            }
          }],
          "taxons_releve": [{
            "id_cor_hab_taxon": 180,
            "cover_pourcentage": 0,
            "id_cor_hab_taxon": 104123,
            "nom_complet": "Juncus arcticus Willd., 1799"
          }, {
            "id_cor_hab_taxon": 182,
            "cover_pourcentage": 10,
            "id_cor_hab_taxon": 88675,
            "nom_complet": "Carex microglochin Wahlenb., 1803"
          }, {
            "id_cor_hab_taxon": 183,
            "cover_pourcentage": 15,
            "id_cor_hab_taxon": 88662,
            "nom_complet": "Carex maritima Gunnerus, 1772"
          }, {
            "id_cor_hab_taxon": 184,
            "cover_pourcentage": 15,
            "id_cor_hab_taxon": 88380,
            "nom_complet": "Carex bicolor All., 1785"
          }, {
            "id_cor_hab_taxon": 185,
            "cover_pourcentage": 20,
            "id_cor_hab_taxon": 88360,
            "nom_complet": "Carex atrofusca Schkuhr, 1801"
          }, {
            "id_cor_hab_taxon": 186,
            "cover_pourcentage": 10,
            "id_cor_hab_taxon": 127195,
            "nom_complet": "Trichophorum pumilum (Vahl) Schinz & Thell., 1921"
          }, {
            "id_cor_hab_taxon": 183,
            "cover_pourcentage": 30,
            "id_cor_hab_taxon": 126806,
            "nom_complet": "Tofieldia pusilla (Michx.) Pers., 1805"
          }]
        }
      }, {
        "code_plot": "126A",
        "id_plot": 126,
        "plot_data": {
          "excretes_presence": true,
          "strates_releve": [{
            "id_base_visit": 2,
            "id_nomenclature_strate": 499,
            "cover_pourcentage": 100,
            "t_nomenclature": {
              "id_nomenclature": 499,
              "mnemonique": "Activit\u00e9s foresti\u00e8res",
              "label_default": "Activit\u00e9s foresti\u00e8res"
            }
          }],
          "taxons_releve": [{
            "id_cor_hab_taxon": 180,
            "cover_pourcentage": 0,
            "id_cor_hab_taxon": 104123,
            "nom_complet": "Juncus arcticus Willd., 1799"
          }, {
            "id_cor_hab_taxon": 182,
            "cover_pourcentage": 10,
            "id_cor_hab_taxon": 88675,
            "nom_complet": "Carex microglochin Wahlenb., 1803"
          }, {
            "id_cor_hab_taxon": 183,
            "cover_pourcentage": 15,
            "id_cor_hab_taxon": 88662,
            "nom_complet": "Carex maritima Gunnerus, 1772"
          }, {
            "id_cor_hab_taxon": 184,
            "cover_pourcentage": 15,
            "id_cor_hab_taxon": 88380,
            "nom_complet": "Carex bicolor All., 1785"
          }, {
            "id_cor_hab_taxon": 185,
            "cover_pourcentage": 20,
            "id_cor_hab_taxon": 88360,
            "nom_complet": "Carex atrofusca Schkuhr, 1801"
          }, {
            "id_cor_hab_taxon": 186,
            "cover_pourcentage": 10,
            "id_cor_hab_taxon": 127195,
            "nom_complet": "Trichophorum pumilum (Vahl) Schinz & Thell., 1921"
          }, {
            "id_cor_hab_taxon": 183,
            "cover_pourcentage": 30,
            "id_cor_hab_taxon": 126806,
            "nom_complet": "Tofieldia pusilla (Michx.) Pers., 1805"
          }]
        }
      }, {
        "code_plot": "127A",
        "id_plot": 127,
        "plot_data": {
          "excretes_presence": true,
          "strates_releve": [{
            "id_nomenclature_strate": 12,
            "cover_pourcentage": 20
          }, {
            "id_nomenclature_strate": 13,
            "cover_pourcentage": 0
          }, {
            "id_nomenclature_strate": 14,
            "cover_pourcentage": 60
          }, {
            "id_nomenclature_strate": 15,
            "cover_pourcentage": 20
          }, {
            "id_nomenclature_strate": 18,
            "cover_pourcentage": 0
          }],
          "taxons_releve": [{
            "id_cor_hab_taxon": 180,
            "cover_pourcentage": 0,
            "id_cor_hab_taxon": 104123,
            "nom_complet": "Juncus arcticus Willd., 1799"
          }, {
            "id_cor_hab_taxon": 182,
            "cover_pourcentage": 10,
            "id_cor_hab_taxon": 88675,
            "nom_complet": "Carex microglochin Wahlenb., 1803"
          }, {
            "id_cor_hab_taxon": 183,
            "cover_pourcentage": 15,
            "id_cor_hab_taxon": 88662,
            "nom_complet": "Carex maritima Gunnerus, 1772"
          }, {
            "id_cor_hab_taxon": 184,
            "cover_pourcentage": 15,
            "id_cor_hab_taxon": 88380,
            "nom_complet": "Carex bicolor All., 1785"
          }, {
            "id_cor_hab_taxon": 185,
            "cover_pourcentage": 20,
            "id_cor_hab_taxon": 88360,
            "nom_complet": "Carex atrofusca Schkuhr, 1801"
          }, {
            "id_cor_hab_taxon": 186,
            "cover_pourcentage": 10,
            "id_cor_hab_taxon": 127195,
            "nom_complet": "Trichophorum pumilum (Vahl) Schinz & Thell., 1921"
          }, {
            "id_cor_hab_taxon": 183,
            "cover_pourcentage": 30,
            "id_cor_hab_taxon": 126806,
            "nom_complet": "Tofieldia pusilla (Michx.) Pers., 1805"
          }]
        }
      }]
    };
    return Observable.of(mock);
  }

  getDefaultVisit(): IVisit {
    return {
      id_base_visit: null,
      visit_date_min: null,
      observers: [],
      cor_transect_visit_perturbation: [],
      plots: [
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
  cor_transect_visit_perturbation?: any[],
  plots?: Plot[]
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

