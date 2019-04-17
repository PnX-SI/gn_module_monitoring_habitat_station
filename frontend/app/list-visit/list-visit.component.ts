import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Location } from "@angular/common";
import { ToastrService } from "ngx-toastr";
import { FormGroup } from "@angular/forms";

import { MapListService } from "@geonature_common/map-list/map-list.service";

import { DataService } from "../services/data.service";
import { StoreService, ISite } from "../services/store.service";
import { ModuleConfig } from "../module.config";
import { UserService } from "../services/user.service";
import { FormService } from "../services/form.service";


@Component({
  selector: "pnx-list-visit",
  templateUrl: "list-visit.component.html",
  styleUrls: ["./list-visit.component.scss"]
})
export class ListVisitComponent implements OnInit, OnDestroy {

  public site: ISite;;
  public show = true;
  public idSite;
  public disabledForm = true;
  public rows = [];
  public paramApp = this.storeService.queryString.append(
    "id_application",
    ModuleConfig.ID_MODULE
  );
  public upIsAllowed = false;
  public addIsAllowed = false;
  public exportIsAllowed = false;
  public dataLoaded = false;

  public formTransect: FormGroup;


  constructor(
    public storeService: StoreService,
    private _location: Location,
    public _api: DataService,
    public activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    public mapListService: MapListService,
    private userService: UserService,
    public router: Router,
    public formService: FormService,

  ) { }

  ngOnInit() {
    this.idSite = this.activatedRoute.snapshot.params['idSite'];
    this.storeService.queryString = this.storeService.queryString.set('id_base_site', this.idSite);
    this.formTransect = this.formService.initFormTransect();
    this.getSiteByID();
  }

  getVisits() {
    this._api.getVisits({ id_base_site: this.idSite }).subscribe(
      data => {
        data.forEach(visit => {
          if (visit && Object.keys(visit).length) {
            let fullName = "";
            let count = visit.observers.length;
            visit.observers.forEach((obs, index) => {
              if (count > 1) {
                if (index + 1 == count)
                  fullName += obs.nom_role + " " + obs.prenom_role;
                else fullName += obs.nom_role + " " + obs.prenom_role + ", ";
              } else fullName = obs.nom_role + " " + obs.prenom_role;
            });
            visit.observers = fullName;
          }
        });
        this.rows = data;
        this.dataLoaded = true;
      },
      error => {
        if (error.status != 404) {
          this.toastr.error("Une erreur est survenue lors de la modification de votre relevé", "", { positionClass: "toast-top-right" });
        }
        this.dataLoaded = true;
      }
    );
  }
  getSiteByID() {
    this._api.getSiteByID(this.idSite).subscribe(
      (site) => {
        this.site = site;
        console.log('site',site);
        this.storeService.setCurrentSite(this.site)
        this.pachForm();
        this.getVisits();
      },
      error => {
        let msg = "";
        if (error.status == 403) {
          msg = "Vous n'êtes pas autorisé à afficher ces données."
        } else {
          msg = "Une erreur est survenue lors de la récupération des informations sur le serveur."
        }
        this.toastr.error(msg, "", { positionClass: "toast-top-right" });
        console.log("error: ", error);
      }
    )
  }


  pachForm() {
    this.formTransect.patchValue({
      geom_start_lat: this.site.geometry.coordinates[0][0],
      geom_start_long: this.site.geometry.coordinates[0][1],
      geom_end_lat: this.site.geometry.coordinates[1][0],
      geom_end_long: this.site.geometry.coordinates[1][1],
      position_plot: this.site.properties.position_plot,
      plot_size: this.site.properties.plot_size
    });
  }

  backToSites() {
    this.router.navigate([`${ModuleConfig.MODULE_URL}/`]);
  }

  onNewVisit() {
    this.router.navigate([`${ModuleConfig.MODULE_URL}/site/${this.site.properties.id_base_site}/new_visit`]);
  }
  onVisitDetails(idVisit) {
    this.router.navigate([`${ModuleConfig.MODULE_URL}/site/${this.site.properties.id_base_site}/visit/`, idVisit]);
  }
  ngOnDestroy() {
    this.storeService.queryString = this.storeService.queryString.delete(
      "id_base_site"
    );
  }
}
