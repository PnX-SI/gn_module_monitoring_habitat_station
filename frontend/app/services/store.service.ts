import {
  HttpParams
} from '@angular/common/http';
import {
  Injectable
} from '@angular/core';
import {
  Layer
} from 'leaflet';
import {
  ModuleConfig
} from '../module.config';
import {
  BehaviorSubject
} from 'rxjs';
import {
  AppConfig
} from '@geonature_config/app.config';

@Injectable()
export class StoreService {

  public shsConfig = ModuleConfig;

  public queryString = new HttpParams();

  public urlLoad = `${AppConfig.API_ENDPOINT}/${ModuleConfig.MODULE_URL}/export_visit`;


  public currentSite$: BehaviorSubject < any > = new BehaviorSubject();

  getCurrentSite() {
    return this.currentSite$.asObservable();
  }

  setCurrentSite(cd_hab, nomhab, idBaseSite, geom_end, geom_start, plot_size, plots, position_plot, transect_label) {
    this.currentSite$.next({
      "cd_hab": cd_hab,
      "nom_habitat": nomhab,
      "id_base_site": idBaseSite,
      "geom_end": geom_end,
      "geom_start": geom_start,
      "plot_size": plot_size,
      "plots": plots,
      "position_plot": position_plot,
      "transect_label": transect_label
    });
  }

}