import {
  Injectable,
  Inject
} from "@angular/core";
import {
  HttpClient,
  HttpParams
} from "@angular/common/http";
import {
  AppConfig
} from "@geonature_config/app.config";
import {
  Observable
} from "rxjs/Observable";

@Injectable()
export class DataService {
  constructor(private _http: HttpClient) {}

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
      "cd_nom": "104123",
      "nom_complet": "Juncus arcticus Willd., 1799"
    }, {
      "cd_nom": "88386",
      "nom_complet": "Carex bipartita Bellardi ex All., 1785"
    }, {
      "cd_nom": "88662",
      "nom_complet": "Carex maritima Gunnerus, 1772"
    }, {
      "cd_nom": "88675",
      "nom_complet": "Carex microglochin Wahlenb., 1803"
    }, {
      "cd_nom": "88380",
      "nom_complet": "Carex bicolor All., 1785"
    }, {
      "cd_nom": "88360",
      "nom_complet": "Carex atrofusca Schkuhr, 1801"
    }, {
      "cd_nom": "127195",
      "nom_complet": "Trichophorum pumilum (Vahl) Schinz & Thell., 1921"
    }, {
      "cd_nom": "126806",
      "nom_complet": "Tofieldia pusilla (Michx.) Pers., 1805"
    }];
    return Observable.of(mock);
  }

  getStrate(params) {
    let mock = [];
    return Observable.of(mock);
  }

  getOneVisit(params) {
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
        "id_plot": 124,
        "cor_releve_plot_strats": [{
          "id_base_visit": 2,
          "id_nomenclature_perturbation": 499,
          "create_date": "2019-03-04 18:37:30.461149",
          "t_nomenclature": {
            "id_nomenclature": 499,
            "mnemonique": "Activit\u00e9s foresti\u00e8res",
            "label_default": "Activit\u00e9s foresti\u00e8res"
          }
        }],
        "cor_releve_plot_taxons": [{
          "id_cor_hab_taxon": 180,
          "cover_porcentage": 0,
          "cd_nom": 104123
        }, {
          "id_cor_hab_taxon": 182,
          "cover_porcentage": 10,
          "cd_nom": 88675
        }, {
          "id_cor_hab_taxon": 183,
          "cover_porcentage": 15,
          "cd_nom": 88662,
        }, {
          "id_cor_hab_taxon": 184,
          "cover_porcentage": 15,
          "cd_nom": 88380,
        }, {
          "id_cor_hab_taxon": 185,
          "cover_porcentage": 20,
          "cd_nom": 88360
        }, {
          "id_cor_hab_taxon": 186,
          "cover_porcentage": 10,
          "cd_nom": 127195
        }, {
          "id_cor_hab_taxon": 183,
          "cover_porcentage": 30,
          "cd_nom": 126806
        }]
      }, {
        "code_plot": "125A",
        "id_plot": 125,
        "cor_releve_plot_strats": [{
          "id_base_visit": 2,
          "id_nomenclature_perturbation": 499,
          "create_date": "2019-03-04 18:37:30.461149",
          "t_nomenclature": {
            "id_nomenclature": 499,
            "mnemonique": "Activit\u00e9s foresti\u00e8res",
            "label_default": "Activit\u00e9s foresti\u00e8res"
          }
        }],
        "cor_releve_plot_taxons": [{
          "id_cor_hab_taxon": 180,
          "cover_porcentage": 0,
          "cd_nom": 104123
        }, {
          "id_cor_hab_taxon": 182,
          "cover_porcentage": 10,
          "cd_nom": 88675
        }, {
          "id_cor_hab_taxon": 183,
          "cover_porcentage": 15,
          "cd_nom": 88662,
        }, {
          "id_cor_hab_taxon": 184,
          "cover_porcentage": 15,
          "cd_nom": 88380,
        }, {
          "id_cor_hab_taxon": 185,
          "cover_porcentage": 20,
          "cd_nom": 88360
        }, {
          "id_cor_hab_taxon": 186,
          "cover_porcentage": 10,
          "cd_nom": 127195
        }, {
          "id_cor_hab_taxon": 183,
          "cover_porcentage": 30,
          "cd_nom": 126806
        }]
      }, {
        "code_plot": "126A",
        "id_plot": 126,
        "cor_releve_plot_strats": [{
          "id_base_visit": 2,
          "id_nomenclature_perturbation": 499,
          "create_date": "2019-03-04 18:37:30.461149",
          "t_nomenclature": {
            "id_nomenclature": 499,
            "mnemonique": "Activit\u00e9s foresti\u00e8res",
            "label_default": "Activit\u00e9s foresti\u00e8res"
          }
        }],
        "cor_releve_plot_taxons": [{
          "id_cor_hab_taxon": 180,
          "cover_porcentage": 0,
          "cd_nom": 104123
        }, {
          "id_cor_hab_taxon": 182,
          "cover_porcentage": 10,
          "cd_nom": 88675
        }, {
          "id_cor_hab_taxon": 183,
          "cover_porcentage": 15,
          "cd_nom": 88662,
        }, {
          "id_cor_hab_taxon": 184,
          "cover_porcentage": 15,
          "cd_nom": 88380,
        }, {
          "id_cor_hab_taxon": 185,
          "cover_porcentage": 20,
          "cd_nom": 88360
        }, {
          "id_cor_hab_taxon": 186,
          "cover_porcentage": 10,
          "cd_nom": 127195
        }, {
          "id_cor_hab_taxon": 183,
          "cover_porcentage": 30,
          "cd_nom": 126806
        }]
      }, {
        "code_plot": "127A",
        "id_plot": 127,
        "strates": [{
          "id_nomenclature_strate": 12,
          "cover_porcentage": 20
        }, {
          "id_nomenclature_strate": 13,
          "cover_porcentage": 0
        }, {
          "id_nomenclature_strate": 14,
          "cover_porcentage": 60
        }, {
          "id_nomenclature_strate": 15,
          "cover_porcentage": 20
        }, {
          "id_nomenclature_strate": 18,
          "cover_porcentage": 0
        }],
        "cor_releve_plot_taxons": [{
          "id_cor_hab_taxon": 180,
          "cover_porcentage": 0,
          "cd_nom": 104123
        }, {
          "id_cor_hab_taxon": 182,
          "cover_porcentage": 10,
          "cd_nom": 88675
        }, {
          "id_cor_hab_taxon": 183,
          "cover_porcentage": 15,
          "cd_nom": 88662,
        }, {
          "id_cor_hab_taxon": 184,
          "cover_porcentage": 15,
          "cd_nom": 88380,
        }, {
          "id_cor_hab_taxon": 185,
          "cover_porcentage": 20,
          "cd_nom": 88360
        }, {
          "id_cor_hab_taxon": 186,
          "cover_porcentage": 10,
          "cd_nom": 127195
        }, {
          "id_cor_hab_taxon": 183,
          "cover_porcentage": 30,
          "cd_nom": 126806
        }]
      }]
    }];
    return Observable.of(mock);
  }

}