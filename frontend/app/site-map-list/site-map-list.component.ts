import { Component, OnInit, Injectable, AfterViewInit, OnDestroy,ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import {
  NgbDateParserFormatter,
  NgbDatepickerConfig,
  NgbDatepickerI18n,
  NgbDateStruct,
} from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Page } from '../shared/models/page.model';
import { Transect } from '../shared/models/transect.model';
import * as L from 'leaflet';
import 'Leaflet.Deflate';

import { MapService } from '@geonature_common/map/map.service';
import { MapListService } from '@geonature_common/map-list/map-list.service';
import { ConfigService } from '@geonature/services/config.service';

import { DataService } from '../shared/services/data.service';
import { StoreService } from '../shared/services/store.service';
import { UserService } from '../shared/services/user.service';
import * as _ from 'lodash';
import { Habitat } from '../shared/models/habitat.model';
import { Station } from '../shared/models/station.model';
import { TranslationWidth } from '@angular/common';
import {animate, state, style, transition, trigger} from '@angular/animations';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort'

const I18N_VALUES = {
  fr: {
    weekdays: ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
    months: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Déc'],
  },
  // other languages you would support
};



@Injectable()
export class I18n {
  language = 'fr';
}
// Define custom service providing the months and weekdays translations
@Injectable()
export class CustomDatepickerI18n extends NgbDatepickerI18n {

  constructor(private _i18n: I18n) {
    super();
  }
  getWeekdayLabel(weekday: number): string {
    return I18N_VALUES[this._i18n.language].weekdays[weekday - 1];
  }
  getWeekdayShortName(weekday: number): string {
    return I18N_VALUES[this._i18n.language].weekdays[weekday - 1];
  }
  getMonthShortName(month: number): string {
    return I18N_VALUES[this._i18n.language].months[month - 1];
  }
  getMonthFullName(month: number): string {
    return this.getMonthShortName(month);
  }
  getDayAriaLabel(date: NgbDateStruct): string {
    return `${date.day}-${date.month}-${date.year}`;
  }
}
@Injectable()
export class NgbDateCustomParserFormatter extends NgbDateParserFormatter {
  parse(value: string): NgbDateStruct {
    throw new Error('Method not implemented.');
  }
  format(date: NgbDateStruct): string {
    return date ? `${date.day}-${date.month}-${date.year}` : '';
  }
}

@Component({
  selector: 'site-map-list',
  templateUrl: 'site-map-list.component.html',
  styleUrls: ['site-map-list.component.scss'],
  providers: [
    NgbDatepickerConfig,
    I18n,
    { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter },
    { provide: NgbDatepickerI18n, useClass: CustomDatepickerI18n },
  ],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class SiteMapListComponent implements OnInit, AfterViewInit, OnDestroy {
  public sites;
  public filteredData = [];
  public tabHab: Habitat[] = [];
  public addIsAllowed: boolean = false;
  public dataLoaded = false;
  public center;
  public zoom;
  private _map;
  private _deflate_features;
  public filterForm: FormGroup;
  public page = new Page();
  minDate: any;
  maxDate: any;
  public stations = [];
  public expandedStations: {[key: number]: Transect[]} = {};
  public dataSource = new MatTableDataSource([])
  public columnsToDisplay = ['Station', 'Habitat', 'Nbre transect', 'Nbre visite', 'Dernière visite']
  public columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];
  public expandedElement : any;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  public tabYear = [];
  public tabArea = [];
  public tabOrganism = [];
  private transectLayers: L.Layer[] =[];
  private selectedTransectLayer : L.Polyline = null; 
  private transectLayerMap: Map<number, L.Polyline> = new Map();
  private selectedTransectId : number = null;
  public columnTooltips: { [key: string]: string } = {
    'Station': 'Nom de la station',
    'Habitat': 'Habitat associé à la station',
    'Nbre transect': 'Nombre de transects de la station',
    'Nbre visite': 'Nombre de visites de la station',
    'Dernière visite': 'Date de la dernière visite'
};


  constructor(
    private config:ConfigService,
    public mapService: MapService,
    private _api: DataService,
    private userService: UserService,
    public dateParser: NgbDateParserFormatter,
    datePickerConfig: NgbDatepickerConfig,
    public storeService: StoreService,
    public mapListService: MapListService,
    public router: Router,
    private toastr: ToastrService,
    private formBuilder: FormBuilder
  ) {
    datePickerConfig.outsideDays = 'hidden';
    datePickerConfig.minDate = { year: 1735, month: 1, day: 1 };
    datePickerConfig.maxDate = { year: 2200, month: 1, day: 1 };
  }

  ngOnInit() {
    this.storeService.loadQueryString();
    this.checkPermission();
    
    this.center = this.storeService.mhsConfig.zoom_center;
    this.zoom = this.storeService.mhsConfig.zoom;
    const savedPageSize = localStorage.getItem('mhs-page-size');
    this.page.size = savedPageSize ? parseInt(savedPageSize, 10) : this.storeService.mhsConfig.items_per_page;
    this.initFilters();
    this.getStations(this.getFiltersFromQueryString());
  }
  private getFiltersFromQueryString(){
    let filter: any = {}
    this.storeService.queryString.keys().forEach(key => {
      filter[key] = this.storeService.queryString.get(key);
    });
    return Object.keys(filter).length > 0 ? filter : undefined
  }

  ngAfterViewInit() {
    let moduleCode = this.config['MHS']['MODULE_CODE'].toLocaleLowerCase();
    this._map = this.mapService.getMap();
    this._deflate_features = (L as any).deflate({
        minSize: 10,
        markerOptions: () => {
            return {
                icon: new L.Icon({
                    iconUrl: `./assets/${moduleCode}/assets/marker-icon.png`,
                    shadowUrl: `./assets/${moduleCode}/assets/marker-shadow.png`,
                    iconSize: [25, 41],
                    iconAnchor: [13, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41],
                })
            };
        }
    });
    this._deflate_features.addTo(this._map);
    this._map.on('zoomend', () => {
    const zoom = this._map.getZoom();
    
    if (zoom >= 12) {
        // Masquer les marqueurs
        Object.values(this.mapListService.layerDict).forEach((marker: any) => {
            marker.setOpacity(0);
        });
        
        // Afficher les transects de toutes les stations visibles
        this.filteredData.forEach(station => {
            if (!this.expandedStations[station.id_station]) {
                this._api.getTransectsByStation(station.id_station).subscribe(
                    (data: any[]) => {
                        this.expandedStations[station.id_station] = data;
                        data.forEach(transect => {
                            let line = L.polyline(
                                [[transect.geom_start.coordinates[1], transect.geom_start.coordinates[0]],
                                 [transect.geom_end.coordinates[1], transect.geom_end.coordinates[0]]],
                                { color: '#3388ff' }
                            )
                            .bindTooltip(transect.transect_label)
                            .addTo(this._map);
                            this.transectLayerMap.set(transect.id_transect, line);
                            this.transectLayers.push(line);
                        });
                    }
                );
            }
        });
    } else {
        // Afficher les marqueurs
        Object.values(this.mapListService.layerDict).forEach((marker: any) => {
            marker.setOpacity(1);
        });
        
        // Supprimer les transects
        this.transectLayers.forEach(layer => this._map.removeLayer(layer));
        this.transectLayers = [];
        this.transectLayerMap.clear();
        
    }
});
   
    this.addCustomControl();
    this.addLegend();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this._api.getStationsYears().subscribe(
     (data : any[])=>{
        this.tabYear = data;
      }
    );
    this._api.getStationsArea().subscribe(
      (data: any[]) =>{
        this.tabArea = data;
      }
    )
    this._api.getOrganism().subscribe(
      (data : any[])=>{
        this.tabOrganism = data;
      }
    )
  }

  checkPermission() {
    this.userService.check_user_cruved_visit('C').subscribe(ucruved => {
      this.addIsAllowed = ucruved;
    });
  }

  getStations(params?: any) {
    this.dataLoaded = false;
    this._api.getAllStations(params).subscribe(
        data => {
            if (data !== null) {
                this.sites = data[1];
                this.page.totalElements = data[0].totalItems;
                    if (this.storeService.mhsConfig.pagination_serverside) {
                        this.page.size = data[0].itemsPerPage;
                    }

                this.sites.features.forEach(site => {
                    if (!_.find(this.tabHab, (habitat: Habitat) => {
                        return habitat.cd_hab == site.properties.cd_hab;
                    })) {
                        this.tabHab.push({
                            cd_hab: site.properties.cd_hab,
                            nom_habitat: site.properties.habitat_name,
                        });
                        this.tabHab = _.sortBy(this.tabHab, [(habitat: Habitat) => {
                            return habitat.nom_habitat;
                        }]);
                    }
                });
                this.filteredData = data[1].features.map(feature => {
                  this._api.getTransectsByStation(feature.properties.id_station).subscribe(
                    (transects: Transect[]) => {
                      this.expandedStations[feature.properties.id_station] = transects;
                    }
                  );
                  return {
                    'Station' : feature.properties.name !== "" ? feature.properties.name : "Sans nom",
                    "Habitat" : feature.properties.habitat_name,
                    'Nbre visite': feature.properties.nb_visits,
                    'Nbre transect': feature.properties.nb_transect,
                    'Dernière visite': feature.properties.last_visit,
                    'id_station' : feature.properties.id_station

                  };
                });
                
                this.dataSource.data = this.filteredData;
                this.page.totalElements = data[0].totalItems;
            } else {
                this.filteredData = [];
                this.dataSource.data = [];
            }
            this.dataLoaded = true;
        },
        error => {
            let msg = 'Une erreur est survenue lors de la récupération des informations sur le serveur.';
            if (error.status == 404) {
                this.page.totalElements = 0;
                this.page.size = 0;
                this.filteredData = [];
            } else if (error.status == 403) {
                msg = "Vous n'êtes pas autorisé à afficher ces données.";
            } else {
                this.toastr.error(msg, '', { positionClass: 'toast-top-right' });
            }
            this.dataLoaded = true;
        }
    );
}
onViewStation(id_station: number) {
    this.transectLayers.forEach(layer => this._map.removeLayer(layer));
    this.transectLayers = [];
    this.transectLayerMap.clear();
    this.selectedTransectLayer = null;

    const data: Transect[]= this.expandedStations[id_station];
    if (data) {
        data.forEach((transect:Transect) => {
            if (!transect.geom_start || !transect.geom_end) return;
            let line = L.polyline(
                [[transect.geom_start.coordinates[1], transect.geom_start.coordinates[0]],
                 [transect.geom_end.coordinates[1], transect.geom_end.coordinates[0]]],
                { color: '#3388ff' }
            )
            .bindTooltip(transect.transect_label)
            .addTo(this._map);
            line.on('click', () => {
              this.onTransectMapClick(transect.id_transect, transect.id_station);
            })
            line.on('mouseover', () => {
                this._map.getContainer().style.cursor = 'cell';
            });
            line.on('mouseout', () => {
                this._map.getContainer().style.cursor = '';
            });
            this.transectLayerMap.set(transect.id_transect, line);
            this.transectLayers.push(line);
        });

        // Zoomer sur les transects
        if (this.transectLayers.length > 0) {
            let group = L.featureGroup(this.transectLayers);
            this._map.fitBounds(group.getBounds());
        }
    }
}

onInfo(id_base_site: any) {
    this.router.navigate([`${this.config['MHS']['MODULE_URL']}/transects`, id_base_site]);
}



  initFilters() {
    this.filterForm = this.formBuilder.group({
      date_low: null,
      date_up: null,
      filterHab: this.storeService.queryString.get('filterHab'),
      year: this.storeService.queryString.get('year'),
      area_name: this.storeService.queryString.get('area_name'),
      organism: this.storeService.queryString.get('organism'),

    });
    this.filterForm.controls['date_low'].statusChanges.subscribe(() => {
      if (this.filterForm.controls['date_low'].value) {
        this.minDate = this.filterForm.controls['date_low'].value;
        if (!this.filterForm.controls['date_up'].value)
          this.filterForm.controls['date_up'].setValue(this.minDate);
      }
    });
    this.filterForm.controls['date_up'].statusChanges.subscribe(() => {
      if (this.filterForm.controls['date_up'].value) {
        this.maxDate = this.filterForm.controls['date_up'].value;
        if (!this.filterForm.controls['date_low'].value)
          this.filterForm.controls['date_low'].setValue(this.minDate);
      }
    });
  }

  setPage(pageInfo) {
    this.page.pageNumber = pageInfo.offset + 1;
    if (this.storeService.mhsConfig.pagination_serverside) {
      this.onSetParams('page', pageInfo.offset + 1);
      this.getStations(this.storeService.queryString.toString());
    }
  }
  // Map-list
  onEachFeature(feature, layer) {
    let site = feature.properties;
    
    // Créer un vrai marqueur avec l'icône goutte
    let marker = L.marker(layer.getLatLng(), {
        icon: new L.Icon({
            iconUrl: './marker-icon.png',
            shadowUrl: './marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [13, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
        })
    });

    // Stocker le marker pour la synchronisation carte-tableau
    this.mapListService.layerDict[feature.id] = marker;

    // Popup au clic
    marker.bindPopup('<div class="title">' + site.name + '</div>');
    
    // Tooltip au survol
    marker.bindTooltip(site.name);

    // Clic sur le marker
    marker.on({
        click: e => {
            this.onMapClick(feature.id);
        }
    });

    // Ajouter à la carte
    marker.addTo(this._map);
  }

  onMapClick(id: string): void {
    const id_station = parseInt(id);
    const index = this.filteredData.findIndex(s=> s.id_station === id_station);
    if(index === -1){
      return ;
    }
    const pageSize = this.paginator.pageSize;
    const pageIndex = Math.floor(index/pageSize);

    this.paginator.pageIndex = pageIndex;
    this.paginator.page.emit({
      pageIndex : pageIndex,
      pageSize : pageSize,
      length : this.paginator.length
    })

    const element = this.filteredData[index];
    this.expandedElement = element;
    this.onViewStation(id_station)
    
  }

  onRowSelect(element:any) {
    const id_station = element.id_station;
    const marker = this.mapListService.layerDict[id_station];
    if(marker){
      this._map.removeLayer(marker)
    }

    this.onViewStation(id_station);
    setTimeout(() => {
      if(this.transectLayers.length > 0){
        let group = L.featureGroup(this.transectLayers);
        this._map.fitBounds(group.getBounds());
      }
    },500);

  }

  zoomOnSelectedLayer(map, layer, zoom) {
    let latlng;
    if (layer instanceof L.Polygon || layer instanceof L.Polyline) {
      latlng = (layer as any).getCenter();
      map.setView(latlng, zoom);
    } else {
      latlng = layer._latlng;
    }
  }

  
  addCustomControl() {
    let initzoomcontrol = new L.Control();
    initzoomcontrol.setPosition('topleft');
    initzoomcontrol.onAdd = () => {
      var container = L.DomUtil.create(
        'button',
        ' btn btn-sm btn-outline-shadow leaflet-bar leaflet-control leaflet-control-custom'
      );
      container.innerHTML =
        '<i class="material-icons" style="vertical-align: text-bottom">crop_free</i>';
      container.style.padding = '4px 4px 1px';
      container.title = "Réinitialiser l'emprise de la carte";
      container.onclick = () => {
        this._map.setView(this.center, this.zoom);
      };
      return container;
    };
    initzoomcontrol.addTo(this._map);
  }

  onSetParams(param: string, value) {
    //  ajouter le queryString pour télécharger les données
    this.storeService.queryString = this.storeService.queryString.set(param, value);
  }

  onFilter() {
    let filter = _.clone(this.filterForm.value);
    filter.date_low = this.dateParser.format(this.filterForm.value.date_low);
    filter.date_up = this.dateParser.format(this.filterForm.value.date_up);
    filter.year = this.filterForm.value.year;
    filter.area_name = this.filterForm.value.area_name;
    filter.organism= this.filterForm.value.organism;
     Object.keys(filter).forEach(key => {
        if (filter[key]) {
            this.storeService.queryString = this.storeService.queryString.set(key, filter[key]);
        } else {
            this.storeService.queryString = this.storeService.queryString.delete(key);
        }
    });
    this.storeService.saveQueryString();
    this.getStations(filter);
  }

  resetFilters() {
    this.filterForm.reset();
    this.storeService.clearQueryString(),
    this.storeService.saveQueryString(),
    this.getStations();
    this.resetMinMaxDate();
    setTimeout(() => {
      this._map.setView(this.center, this.zoom);
    }, 100);
  }

  onNewTransect() {
    this.router.navigate([`${this.config['MHS']['MODULE_URL']}/transects/new_transect`]);
  }

  closeFix(event, datePicker) {
    if (event.target.offsetParent == null) datePicker.close();
    else if (event.target.offsetParent.nodeName != 'NGB-DATEPICKER') datePicker.close();
  }
  resetMinMaxDate() {
    this.maxDate = { year: 2200, month: 1, day: 1 };
    this.minDate = null;
  }
  onSelectTransect(id_transect: number) {
    this.transectLayers.forEach((layer: any) => {
        layer.setStyle({ color: '#3388ff' });
    });
    
    const selectedLayer = this.transectLayerMap.get(id_transect)
    if (selectedLayer) {
        selectedLayer.setStyle({ color: '#ff0000' });
        this.selectedTransectLayer = selectedLayer;
        this.selectedTransectId = id_transect;
    }
}
  onTransectMapClick(id_transect: number, id_station:number){
    const index = this.filteredData.findIndex(s => s.id_station === id_station);
    if(index=== -1){
      return ;
    }
    const pageSize = this.paginator.pageSize;
    const pageIndex = Math.floor(index/pageSize);
    this.paginator.pageIndex = pageIndex;
    this.paginator.page.emit({
      pageIndex : pageIndex,
      pageSize : pageSize,
      length : this.paginator.length
    })

    const element = this.filteredData[index];
    this.expandedElement = null;
    setTimeout(() => {
      this.expandedElement = element;
      this.selectedTransectId = id_transect;
      this.onSelectTransect(id_transect)
    })

  }
  addLegend() {
    let legend = new L.Control({ position: 'bottomright' });
    legend.onAdd = () => {
        return this.storeService.buildMapLegend();
    };
    legend.addTo(this._map);
}
onPageChange(event: any) {
    this.page.size = event.pageSize;
    localStorage.setItem('mhs-page-size', event.pageSize.toString());
}
  

  ngOnDestroy() {
    this.storeService.saveQueryString();
    this.storeService.clearQueryString();
}
}
