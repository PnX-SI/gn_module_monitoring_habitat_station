import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { ToastrService } from "ngx-toastr";

import { MapListService } from "@geonature_common/map-list/map-list.service";

import { DataService } from "../services/data.service";
import { StoreService } from "../services/store.service";
import { ModuleConfig } from "../module.config";
import { UserService } from "../services/user.service";

@Component({
  selector: "pnx-list-visit",
  templateUrl: "list-visit.component.html",
  styleUrls: ["./list-visit.component.scss"]
})
export class ListVisitComponent implements OnInit, OnDestroy {
  public site;
  public currentSite = {};
  public show = true;
  public idSite;
  public nomHabitat;
  public organisme;
  public nomCommune;
  public siteName;
  public siteCode;
  public siteDesc;
  public cdHabitat;
  public taxons;
  public rows = [];
  public paramApp = this.storeService.queryString.append(
    "id_application",
    ModuleConfig.ID_MODULE
  );
  public upIsAllowed = false;
  public addIsAllowed = false;
  public exportIsAllowed = false;
  public dataLoaded = false;


  constructor(
    public storeService: StoreService,
    private _location: Location,
    public _api: DataService,
    public activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    public mapListService: MapListService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.idSite = this.activatedRoute.snapshot.params['idSite'];
    this.storeService.queryString = this.storeService.queryString.set('id_base_site', this.idSite);
  }

 

  ngAfterViewInit() {
    this.getSites();
  }

  getVisits() {
    this._api.getVisits({ id_base_site: this.idSite }).subscribe(
      data => {
        data.forEach(visit => {
          if (visit && visit.length) {
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
          this.toastr.error(
            "Une erreur est survenue lors de la modification de votre relevé",
            "",
            {
              positionClass: "toast-top-right"
            }
          );
        }
        this.dataLoaded = true;
      }
    );
  }

  getSites() {
    this.paramApp = this.paramApp.append("id_base_site", this.idSite);
    this._api.getSite(this.paramApp).subscribe(
      data => {
        this.site = data;

        this.organisme = data.organisme;
        this.nomCommune = data.nom_commune;
        this.nomHabitat = data.nom_habitat;
        this.siteName = data.base_site_name;
        this.siteCode = data.base_site_code;
        this.siteDesc = data.base_site_description;
        this.cdHabitat = data.cd_hab;


        // UP cd_hab nom_habitat id site
        this.storeService.setCurrentSite(
          this.cdHabitat,
          this.nomHabitat,
          this.idSite
        );

        this.getVisits();
      },
      error => {
        let msg = "";
        if (error.status == 403) {
          msg = "Vous n'êtes pas autorisé à afficher ces données."
        } else {
          msg = "Une erreur est survenue lors de la récupération des informations sur le serveur."
        }
        this.toastr.error(
          msg,
          "",
          {
            positionClass: "toast-top-right"
          }
        );
        console.log("error: ", error);
      }
    );
  }

  backToSites() {
    this._location.back();
  }

  ngOnDestroy() {
    this.storeService.queryString = this.storeService.queryString.delete(
      "id_base_site"
    );
  }
}
