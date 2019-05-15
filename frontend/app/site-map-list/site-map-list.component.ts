import { Component, OnInit, Injectable, AfterViewInit, OnDestroy } from "@angular/core";
import { Router } from "@angular/router";
import { NgbDateParserFormatter, NgbDatepickerConfig, NgbDatepickerI18n, NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import { ToastrService } from "ngx-toastr";
import { FormGroup, FormBuilder } from "@angular/forms";
import { Page } from "../shared/page";
import * as L from "leaflet";

import { MapService } from "@geonature_common/map/map.service";
import { MapListService } from "@geonature_common/map-list/map-list.service";

import { DataService, Habitat } from "../services/data.service";
import { StoreService } from "../services/store.service";
import { UserService } from "../services/user.service";
import { ModuleConfig } from "../module.config";
import * as _ from 'lodash'


const I18N_VALUES = {
  'fr': {
    weekdays: ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'],
    months: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Déc'],
  }
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
  format(date: NgbDateStruct): string {
    return date ? `${date.day}-${date.month}-${date.year}` : '';
  }
}

@Component({
  selector: "site-map-list",
  templateUrl: "site-map-list.component.html",
  styleUrls: ["site-map-list.component.scss"],
  providers: [NgbDatepickerConfig, I18n, { provide: NgbDateParserFormatter, useClass: NgbDateCustomParserFormatter }, { provide: NgbDatepickerI18n, useClass: CustomDatepickerI18n }]
})
export class SiteMapListComponent implements OnInit, AfterViewInit, OnDestroy {

  public sites;
  public filteredData = [];
  public tabHab: Habitat[] = [];
  public addIsAllowed: boolean =false;
  public dataLoaded = false;
  public center;
  public zoom;
  private _map;
  public filterForm: FormGroup;
  public page = new Page();
  minDate: any;
  maxDate: any;



  constructor(
    public mapService: MapService,
    private _api: DataService,
    private userService: UserService,
    public dateParser: NgbDateParserFormatter,
    datePickerConfig: NgbDatepickerConfig,
    public storeService: StoreService,
    public mapListService: MapListService,
    public router: Router,
    private toastr: ToastrService,
    private _fb: FormBuilder,
  ) {
    datePickerConfig.outsideDays = 'hidden';
    datePickerConfig.minDate = { year: 1735, month: 1, day: 1 };
    datePickerConfig.maxDate = { year: 2200, month: 1, day: 1 };
  }

  ngOnInit() {
    this.checkPermission();
    this.getTransects();
    this.center = this.storeService.shsConfig.zoom_center;
    this.zoom = this.storeService.shsConfig.zoom;
    this.initFilters();
  }

  ngAfterViewInit() {
    this._map = this.mapService.getMap();
    this.addCustomControl();
  }

  checkPermission() {
    this.userService.check_user_cruved_visit('C').subscribe(ucruved => {
      this.addIsAllowed = ucruved;
    })
  }


  getTransects(params?) {
    this._api.getAllTransects(params).subscribe(
      data => {
        this.sites = data[1];
        this.page.totalElements = data[0].totalItmes;
        this.page.size = data[0].items_per_page;
        this.sites.features.forEach(site => {
          if (!_.find(this.tabHab, (habitat: Habitat) => { return habitat.cd_hab == site.properties.cd_hab })) {
            this.tabHab.push({
              cd_hab: site.properties.cd_hab,
              nom_habitat: site.properties.nom_habitat
            });
            this.tabHab = _.sortBy(this.tabHab, [(habitat: Habitat) => { return habitat.nom_habitat }])
          }
        });
        this.mapListService.loadTableData(data[1]);
        this.filteredData = this.mapListService.tableData;
        this.dataLoaded = true;
      },
      error => {
        let msg = "Une erreur est survenue lors de la récupération des informations sur le serveur.";
        if (error.status == 404) {
          this.page.totalElements = 0;
          this.page.size = 0;
          this.filteredData = [];
        } else if (error.status == 403) {
          msg = "Vous n'êtes pas autorisé à afficher ces données.";
        } else {
          this.toastr.error(msg, "", { positionClass: "toast-top-right" });
        }
        this.dataLoaded = true;
      }
    );
  }

  initFilters() {
    this.filterForm = this._fb.group({
      date_low: null,
      date_up: null,
      filterHab: null
    });
    this.filterForm.controls['date_low'].statusChanges
      .subscribe(() => {
        if (this.filterForm.controls['date_low'].value) {
          this.minDate = this.filterForm.controls['date_low'].value;
          if (!this.filterForm.controls['date_up'].value)
            this.filterForm.controls['date_up'].setValue(this.minDate);
        }
      })
    this.filterForm.controls['date_up'].statusChanges
      .subscribe(() => {
        if (this.filterForm.controls['date_up'].value) {
          this.maxDate = this.filterForm.controls['date_up'].value;
          if (!this.filterForm.controls['date_low'].value)
            this.filterForm.controls['date_low'].setValue(this.minDate);
        }
      })
  }

  setPage(pageInfo) {
    this.page.pageNumber = pageInfo.offset;
    if (this.storeService.shsConfig.pagination_serverside) {
      this.onSetParams("page", pageInfo.offset + 1);
      this.getTransects(this.storeService.queryString.toString());
    }
  }
  // Map-list
  onEachFeature(feature, layer) {
    let site = feature.properties;
    this.mapListService.layerDict[feature.id] = layer;

    const customPopup = '<div class="title">' + site.transect_label + "</div>";
    const customOptions = {
      className: "custom-popup"
    };

    layer.bindPopup(customPopup, customOptions);
    layer.on({
      click: e => {
        this.onMapClick(feature.id);
      }
    });
  }

  onMapClick(id): void {
    const integerId = parseInt(id);
    this.mapListService.selectedRow = [];
    this.mapListService.selectedRow.push(
      this.mapListService.tableData[integerId - 1]
    );
  }

  onRowSelect(row) {
    let id = row.selected[0]["id_base_site"];
    const selectedLayer = this.mapListService.layerDict[id];
    this.zoomOnSelectedLayer(this._map, selectedLayer, 16);
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

  onInfo(id_base_site) {
    this.router.navigate([
      `${ModuleConfig.MODULE_URL}/transects`,
      id_base_site
    ]);
  }

  addCustomControl() {
    let initzoomcontrol = new L.Control();
    initzoomcontrol.setPosition("topleft");
    initzoomcontrol.onAdd = () => {
      var container = L.DomUtil.create(
        "button",
        " btn btn-sm btn-outline-shadow leaflet-bar leaflet-control leaflet-control-custom"
      );
      container.innerHTML =
        '<i class="material-icons" style="vertical-align: text-bottom">crop_free</i>';
      container.style.padding = "4px 4px 1px";
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
    this.storeService.queryString = this.storeService.queryString.set(
      param,
      value
    );
  }

  onFilter() {
    let filter = _.clone(this.filterForm.value);
    filter.date_low = this.dateParser.format(this.filterForm.value.date_low);
    filter.date_up = this.dateParser.format(this.filterForm.value.date_up);
    this.getTransects(filter);

  }

  resetFilters() {
    this.filterForm.reset();
    this.getTransects();
    this.resetMinMaxDate();
    setTimeout(() => {
      this._map.setView(this.center, this.zoom);
    }, 100);
  }

  onNewTransect() {
    this.router.navigate([
      `${ModuleConfig.MODULE_URL}/transects/new_transect`,
    ]);
  }

  closeFix(event, datePicker) {
    if (event.target.offsetParent == null)
      datePicker.close();
    else if (event.target.offsetParent.nodeName != "NGB-DATEPICKER")
      datePicker.close();
  }
  resetMinMaxDate() {
    this.maxDate = { year: 2200, month: 1, day: 1 };
    this.minDate = null;
  }

  ngOnDestroy() {
    let filterkey = this.storeService.queryString.keys();
    filterkey.forEach(key => {
      this.storeService.queryString = this.storeService.queryString.delete(key);
    });
  }
}
