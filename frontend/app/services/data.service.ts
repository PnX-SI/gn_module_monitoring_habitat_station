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
      {"type": "FeatureCollection", "features": [{"type": "Feature", "id": "3", "geometry": {"type": "MultiPolygon", "coordinates": [[[[6.8888742423556, 44.82022047806151], [6.88888669726036, 44.82040032295452], [6.888899152618478, 44.82058017325221], [6.88891160768266, 44.820760018164016], [6.888924062826561, 44.82093986308504], [6.889176761526891, 44.820930997948935], [6.889429452566679, 44.82092213250332], [6.88968214352675, 44.82091326648221], [6.88993484198788, 44.820904399619515], [6.890187532788478, 44.820895532447324], [6.89017507361114, 44.82071568767081], [6.890162614513539, 44.82053584290361], [6.89015015512191, 44.820355992750336], [6.89013769618379, 44.8201761480018], [6.890125237325409, 44.819996303262606], [6.889872550558178, 44.82000517029032], [6.889619856130519, 44.82001403700843], [6.88936716920382, 44.82002290288501], [6.8891144821973995, 44.82003176818621], [6.888861787530569, 44.82004063317782], [6.8888742423556, 44.82022047806151]]]]}, "properties": {"id_infos_site": 3, "id_base_site": 149, "cd_hab": 16265, "date_max": "2018-03-09", "nom_habitat": "<em>Caricion incurvae</em> Br.-Bl. in Volk 1940", "nb_visit": "1", "organisme": "Autre", "nom_commune": "Abri\u00e8s", "base_site_code": "4033890", "base_site_description": "Aucune description", "base_site_name": "HAB-149"}}]}]
    return Observable.of(mock);
  }
}
