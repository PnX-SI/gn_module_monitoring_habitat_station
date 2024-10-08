import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs/observable/forkJoin';
import * as _ from 'lodash';

import { DataFormService } from '@geonature_common/form/data-form.service';
import { MapListService } from '@geonature_common/map-list/map-list.service';
import { ConfigService } from '@geonature/services/config.service';

import { DataService } from '../shared/services/data.service';
import { StoreService } from '../shared/services/store.service';
import { UserService } from '../shared/services/user.service';
import { Page } from '../shared/models/page.model';
import { ISite } from '../shared/models/site.model';


@Component({
  selector: 'pnx-list-visit',
  templateUrl: 'list-visit.component.html',
  styleUrls: ['./list-visit.component.scss'],
})
export class ListVisitComponent implements OnInit, OnDestroy {
  public currentSite: ISite;
  sites;
  plots = [];
  transect_title: string = 'Consultation du transect ';
  public show = true;
  public idSite;
  public disabledForm = true;
  public rows = [];
  public page = new Page();
  public paramApp = this.storeService.queryString.append(
    'id_application',
    '' + this.config['MHS']['MODULE_CODE']
  );
  public upIsAllowed = false;
  addIsAllowed = false;
  dataLoaded = false;
  formTransect: FormGroup;
  edit_btn: string = 'Editer';
  habitats: any;
  isNew: boolean;
  plot_position: any;
  addVisitIsAllowed = false;
  formPlot: FormGroup;
  private modalRef: NgbModalRef;

  constructor(
    private config: ConfigService,
    public storeService: StoreService,
    private api: DataService,
    public activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    public mapListService: MapListService,
    private modalService: NgbModal,
    public router: Router,
    private userService: UserService,
    private nomenclatureServ: DataFormService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.idSite = this.activatedRoute.snapshot.params['idSite'];
    this.isNew = !this.idSite;
    this.storeService.queryString = this.storeService.queryString.set('id_base_site', this.idSite);
    this.checkPermission();

    forkJoin([
      this.api.getAllSites({ id_base_site: this.idSite }),
      this.api.getHabitats(),
      this.nomenclatureServ.getNomenclature('POSITION_PLACETTE', null, null, null, {
        orderby: 'label_default',
      }),
    ]).subscribe(
      results => {
        this.sites = results[0];
        this.habitats = results[1];
        this.plot_position = results[2] ? results[2].values : [];
        this.formTransect = this.initFormTransect();
        if (!this.isNew) {
          this.loadTransect();
        } else {
          this.transect_title = 'Nouveau transect';
          this.dataLoaded = true;
          this.disabledForm = false;
        }
      },
      error => {
        const msg =
          error.error.message == 'sites_not_found'
            ? "Aucun site n'est disponible pour ajouter un nouveau transect."
            : 'Une erreur est survenue lors de la récupération des informations sur le serveur.';
        this.toastr.error(msg, '', { positionClass: 'toast-top-right' });
        this.router.navigate([`${this.config['MHS']['MODULE_URL']}/`]);
      }
    );
  }

  onRowSelect(e) {
    this.onVisitDetails(e.selected[0].id_base_visit);
  }

  checkPermission() {
    this.userService.check_isAdmin('U').subscribe(ucruved => {
      this.upIsAllowed = ucruved;
    });
    this.userService.check_isAdmin('C').subscribe(ucruved => {
      this.addIsAllowed = ucruved;
    });
    this.userService.check_user_cruved_visit('C').subscribe(ucruved => {
      this.addVisitIsAllowed = ucruved;
    });
  }

  initFormTransect(): FormGroup {
    const formTransect = this.formBuilder.group({
      id_base_site: [null],
      base_site_description: [null],
      id_transect: [null],
      geom_end_lat: [null, Validators.required],
      geom_end_long: [null, Validators.required],
      geom_start_lat: [null, Validators.required],
      geom_start_long: [null, Validators.required],
      plot_size: [null, Validators.required],
      plot_shape: [null],
      transect_label: [null, Validators.required],
      cd_hab: [null, Validators.required],
      id_nomenclature_plot_position: [null, Validators.required],
    });
    return formTransect;
  }

  getVisits() {
    this.api
      .getAllVisits(this.idSite)
      .pipe(
        map(data => {
          return data === null ? [{ totalItems: 0, itemsPerPage: 10 }, []] : data;
        })
      )
      .subscribe(
        data => {
          this.page.totalElements = data[0].totalItems;
          this.page.size = data[0].itemsPerPage;
          let visits = data[1] ? data[1] : [];
          visits.forEach(visit => {
            if (visit && visit.observers) {
              let fullName = '';
              let count = visit.observers.length;
              visit.observers.forEach((obs, index) => {
                if (count > 1) {
                  if (index + 1 == count) {
                    fullName += obs.nom_role + ' ' + obs.prenom_role;
                  } else {
                    fullName += obs.nom_role + ' ' + obs.prenom_role + ', ';
                  }
                } else {
                  fullName = obs.nom_role + ' ' + obs.prenom_role;
                }
              });
              visit.observers = fullName;
            }
          });
          this.rows = visits;
          this.dataLoaded = true;
        },
        error => {
          let notErrorStatus = [204, 404];
          console.log('error.status:', error.status);
          if (!notErrorStatus.includes(error.status)) {
            this.toastr.error(
              'Une erreur est survenue lors de la récupération des informations sur le serveur.',
              '',
              { positionClass: 'toast-top-right' }
            );
          }
          this.dataLoaded = true;
        }
      );
  }

  private loadTransect() {
    this.api.getOneTransect(this.idSite).subscribe(
      site => {
        this.currentSite = site;
        if (!this.currentSite.properties.cor_plots) {
          let msg = 'Ajouter des placettes à votre transect pour y associer des visites.';
          this.toastr.error(msg, '', { positionClass: 'toast-top-right' });
          this.addVisitIsAllowed = false;
        } else {
          this.plots = _.cloneDeep(this.currentSite.properties.cor_plots);
        }
        this.transect_title = this.transect_title + this.currentSite.properties.transect_label;
        this.storeService.setCurrentSite(this.currentSite);
        this.pachForm();
        this.getVisits();
      },
      error => {
        let msg = '';
        if (error.status == 403) {
          msg = "Vous n'êtes pas autorisé à afficher ces données.";
        } else {
          msg = 'Une erreur est survenue lors de la récupération des informations sur le serveur.';
        }
        this.toastr.error(msg, '', { positionClass: 'toast-top-right' });
        console.log('error: ', error);
      }
    );
  }

  pachForm() {
    this.formTransect.patchValue({
      id_base_site: this.currentSite.properties.id_base_site,
      base_site_description: this.currentSite.properties.base_site_description,
      id_transect: this.currentSite.properties.id_transect,
      geom_start_lat: this.currentSite.geometry.coordinates[0][1],
      geom_start_long: this.currentSite.geometry.coordinates[0][0],
      geom_end_lat: this.currentSite.geometry.coordinates[1][1],
      geom_end_long: this.currentSite.geometry.coordinates[1][0],
      id_nomenclature_plot_position: this.currentSite.properties.plot_position.id_nomenclature,
      cd_hab: this.currentSite.properties.cd_hab,
      plot_size: this.currentSite.properties.plot_size,
      plot_shape: this.currentSite.properties.plot_shape,
      transect_label: this.currentSite.properties.transect_label,
    });
  }

  backToSites() {
    this.router.navigate([`${this.config['MHS']['MODULE_URL']}/`]);
  }

  onNewVisit() {
    this.router.navigate([
      `${this.config['MHS']['MODULE_URL']}/transects/${this.currentSite.properties.id_base_site}/new_visit`,
    ]);
  }

  onVisitDetails(idVisit) {
    this.router.navigate([
      `${this.config['MHS']['MODULE_URL']}/transects/${this.currentSite.properties.id_base_site}/visit/`,
      idVisit,
    ]);
  }

  onAddPlot(content) {
    this.formPlot = this.formBuilder.group({
      code_plot: [null, Validators.required],
      distance_plot: [null, Validators.required],
    });
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  onSavePlot() {
    this.plots.push(this.formPlot.value);
    this.modalRef.close();
  }

  onEdit() {
    this.disabledForm = !this.disabledForm;
    if (!this.disabledForm) {
      this.edit_btn = 'Annuler';
    } else {
      this.plots = this.currentSite.properties.cor_plots;
      this.pachForm();
      this.edit_btn = 'Éditer';
    }
  }

  onSubmitTransect() {
    let transect = this.formTransect.value;
    transect.cor_plots = this.plots;

    transect.geom_start = `SRID=4326;POINT(${transect.geom_start_long} ${transect.geom_start_lat})`;
    transect.geom_end = `SRID=4326;POINT(${transect.geom_end_long} ${transect.geom_end_lat})`;
    delete transect.geom_end_long;
    delete transect.geom_start_long;
    delete transect.geom_end_lat;
    delete transect.geom_start_lat;

    if (this.isNew) {
      this.api.addTransect(transect).subscribe(
        data => {
          this.toastr.success('Le transect a été ajouté avec succès', '', {
            positionClass: 'toast-top-right',
          });
          this.backToSites();
        },
        error => {
          this.toastr.error('Une erreur est survenue lors de la création du transect', '', {
            positionClass: 'toast-top-right',
          });
          this.backToSites();
        }
      );
    } else {
      this.api.updateTransect(transect).subscribe(
        data => {
          this.toastr.success('Le transect a été modifié avec succès', '', {
            positionClass: 'toast-top-right',
          });
          this.backToSites();
        },
        error => {
          this.toastr.error('Une erreur est survenue lors de la modification du transect', '', {
            positionClass: 'toast-top-right',
          });
          this.backToSites();
        }
      );
    }
  }

  ngOnDestroy() {
    this.storeService.queryString = this.storeService.queryString.delete('id_base_site');
  }
}
