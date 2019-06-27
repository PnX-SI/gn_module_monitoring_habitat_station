import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ToastrService } from "ngx-toastr";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Page } from "../shared/page";
import { MapListService } from "@geonature_common/map-list/map-list.service";
import { forkJoin } from "rxjs/observable/forkJoin";
import { DataService } from "../services/data.service";
import { StoreService, ISite } from "../services/store.service";
import { ModuleConfig } from "../module.config";
import { FormService } from "../services/form.service";
import { DataFormService } from "@geonature_common/form/data-form.service";
import { UserService } from "../services/user.service";
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as _ from 'lodash';

@Component({
  selector: "pnx-list-visit",
  templateUrl: "list-visit.component.html",
  styleUrls: ["./list-visit.component.scss"]
})
export class ListVisitComponent implements OnInit, OnDestroy {

  public currentSite: ISite;
  sites;
  plots = [];
  transect_title: string = "Consultation du transect ";
  public show = true;
  public idSite;
  public disabledForm = true;
  public rows = [];
  public page = new Page();
  public paramApp = this.storeService.queryString.append(
    "id_application",
    ModuleConfig.ID_MODULE
  );
  public upIsAllowed = false;
  public addIsAllowed = false;
  public exportIsAllowed = false;
  public dataLoaded = false;
  public formTransect: FormGroup;
  public edit_btn: string = 'Editer';
  habitats: any;
  isNew: boolean;
  plot_position: any;
  public addVisitIsAllowed = false;
  formPlot: FormGroup;
  modalRef: NgbModalRef;

  constructor(
    public storeService: StoreService,
    public _api: DataService,
    public activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    public mapListService: MapListService,
    private modalService: NgbModal,
    public router: Router,
    private userService: UserService,
    public formService: FormService,
    private nomenclatureServ: DataFormService,
    private _fb: FormBuilder,
  ) { }

  ngOnInit() {

    this.idSite = this.activatedRoute.snapshot.params['idSite'];
    this.isNew = !this.idSite;
    this.storeService.queryString = this.storeService.queryString.set('id_base_site', this.idSite);
    this.checkPermission();
    forkJoin([
      this._api.getSites({ 'id_base_site': this.idSite, 'type': ModuleConfig.site_type }),
      this._api.getHabitatsList(ModuleConfig.id_bib_list_habitat),
      this.nomenclatureServ.getNomenclature('POSITION_PLACETTE', null, null, { orderby: 'label_default' }),
    ]).subscribe(results => {
      this.sites = results[0];
      this.habitats = results[1];
      this.plot_position = results[2].values;
      this.formTransect = this.formService.initFormTransect();
      if (!this.isNew) {
        this.getTtransectByIdSite();
      }
      else {
        this.transect_title = "Nouveau transect";
        this.dataLoaded = true;
        this.disabledForm = false;
      }
    },
      (error) => {
        let msg = "";
        if (error.error == "sites_not_found") {
          msg = "Aucun site n'est disponible pour ajouter un nouveau transect."
        } else {
          msg = "Une erreur est survenue lors de la récupération des informations sur le serveur."
        }
        this.toastr.error(msg, "", { positionClass: "toast-top-right" });
        this.router.navigate([`${ModuleConfig.MODULE_URL}/`])
      }
    );
  }
  onRowSelect(e) {
    this.onVisitDetails(e.selected[0].id_base_visit)
  }

  checkPermission() {
    this.userService.check_user_cruved_visit('E').subscribe(ucruved => {
      this.exportIsAllowed = ucruved;
    })
    this.userService.check_isAdmin('U').subscribe(ucruved => {
      this.upIsAllowed = ucruved;
    })
    this.userService.check_isAdmin('C').subscribe(ucruved => {
      this.addIsAllowed = ucruved;
    })
    this.userService.check_user_cruved_visit('C').subscribe(ucruved => {
      this.addVisitIsAllowed = ucruved;
    })
  }

  getVisits() {
    this._api.getVisits(this.idSite).subscribe(
      data => {
        this.page.totalElements = data[0].totalItmes;
        this.page.size = data[0].items_per_page;
        data[1].forEach(visit => {
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
        this.rows = data[1];
        this.dataLoaded = true;
      },
      error => {
        if (error.status != 404) {
          this.toastr.error("Une erreur est survenue lors de la récupération des informations sur le serveur.", "", { positionClass: "toast-top-right" });
        }
        this.dataLoaded = true;
      }
    );
  }

  getTtransectByIdSite() {
    this._api.getTtransectByIdSite(this.idSite).subscribe(
      (site) => {
        this.currentSite = site;
        if (! this.currentSite.properties.cor_plots) {
          let msg = "Ajouter des placettes à votre transect pour y associer des visites.";
          this.toastr.error(msg, "", { positionClass: "toast-top-right" });
          this.addVisitIsAllowed = false
        } else {
          this.plots = _.cloneDeep(this.currentSite.properties.cor_plots);
        }
        this.transect_title = this.transect_title + this.currentSite.properties.transect_label;
        this.storeService.setCurrentSite(this.currentSite);
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
      id_base_site: this.currentSite.properties.id_base_site,
      id_transect: this.currentSite.properties.id_transect,
      geom_start_lat: this.currentSite.geometry.coordinates[0][1],
      geom_start_long: this.currentSite.geometry.coordinates[0][0],
      geom_end_lat: this.currentSite.geometry.coordinates[1][1],
      geom_end_long: this.currentSite.geometry.coordinates[1][0],
      id_nomenclature_plot_position: this.currentSite.properties.plot_position.id_nomenclature,
      cd_hab: this.currentSite.properties.cd_hab,
      plot_size: this.currentSite.properties.plot_size,
      transect_label: this.currentSite.properties.transect_label,
    });
  }

  backToSites() {
    this.router.navigate([`${ModuleConfig.MODULE_URL}/`]);
  }

  onNewVisit() {
    this.router.navigate([`${ModuleConfig.MODULE_URL}/transects/${this.currentSite.properties.id_base_site}/new_visit`]);
  }
  onVisitDetails(idVisit) {
    this.router.navigate([`${ModuleConfig.MODULE_URL}/transects/${this.currentSite.properties.id_base_site}/visit/`, idVisit]);
  }

  onAddPlot(content) {
    this.formPlot = this._fb.group({
      code_plot: [null, Validators.required],
      distance_plot: [null, Validators.required],
    });
    this.modalRef = this.modalService.open(content, { centered: true });

  }
  onSavePlot() {
    this.plots.push(this.formPlot.value);
    this.modalRef.close()
  }

  onEdit() {
    this.disabledForm = !this.disabledForm;
    if (!this.disabledForm) {
      this.edit_btn = "Annuler"
    }
    else {
      this.plots = this.currentSite.properties.cor_plots;
      this.pachForm();
      this.edit_btn = "Editer";
    }
  }

  onSubmitTransect() {
    let transect = this.formTransect.value;
    transect.cor_plots = this.plots;
    transect.geom_start = 'SRID=4326;POINT(' + this.formTransect.value.geom_start_long + ' ' + this.formTransect.value.geom_start_lat + ')';
    transect.geom_end = 'SRID=4326;POINT(' + this.formTransect.value.geom_end_long + ' ' + this.formTransect.value.geom_end_lat + ')';
    delete transect.geom_end_long;
    delete transect.geom_start_long;
    delete transect.geom_end_lat;
    delete transect.geom_start_lat;
    if (this.isNew)
      this._api.postTransect(transect).subscribe(
        (data) => {
          this.toastr.success("Le transect a été ajouté avec succès", "", { positionClass: "toast-top-right" });
          this.backToSites()
        },
        (error) => {
          this.toastr.error("Une erreur est survenue lors de la création du transect", "", { positionClass: "toast-top-right" });
          this.backToSites();
        }
      )
    else
      this._api.updateTransect(transect).subscribe(
        (data) => {
          this.toastr.success("Le transect a été modifié avec succès", "", { positionClass: "toast-top-right" });
          this.backToSites()
        },
        (error) => {
          this.toastr.error("Une erreur est survenue lors de la modification du transect", "", { positionClass: "toast-top-right" });
          this.backToSites();
        }
      )
  }

  ngOnDestroy() {
    this.storeService.queryString = this.storeService.queryString.delete(
      "id_base_site"
    );
  }
}
