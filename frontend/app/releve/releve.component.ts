import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NgbDateParserFormatter } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

import { CommonService } from '@geonature_common/service/common.service';
import { DataFormService } from '@geonature_common/form/data-form.service';
import { ConfigService } from '@geonature/services/config.service';

import { DataService } from '../shared/services/data.service';
import { StoreService } from '../shared/services/store.service';
import { UserService } from '../shared/services/user.service';
import { IVisit, Plot } from '../shared/models/visit.model';
import { ISite } from '../shared/models/site.model';


@Component({
  selector: 'releve',
  templateUrl: 'releve.component.html',
  styleUrls: ['./releve.component.scss'],
})
export class ReleveComponent implements OnInit {
  idSite: number;
  idVisit: number;
  loadForm: boolean = false;
  visit: IVisit;
  isNew: boolean;
  public species = [];
  public visit_name: string = 'Nouvelle visite';
  public id_base_site: number;
  public strates = [];
  taxons;
  checked = 0;
  currentSite: ISite;
  plots: Plot[] = [];
  plotId: number;
  visitForm: FormGroup;
  plotTitle: string;
  submit_label: string;
  selectedPlot;
  spinner: boolean;
  public disabledForm: boolean = true;
  public edit_btn: string = 'Editer';
  public updateIsAllowed: boolean = false;
  public addIsAllowed: boolean = false;

  constructor(
    private config: ConfigService,
    private activatedRoute: ActivatedRoute,
    private commonService: CommonService,
    public router: Router,
    private formBuilder: FormBuilder,
    public dateParser: NgbDateParserFormatter,
    public storeService: StoreService,
    private _api: DataService,
    private toastr: ToastrService,
    private nomenclatureServ: DataFormService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.idSite = this.activatedRoute.snapshot.params['idSite'];
    this.idVisit = this.activatedRoute.snapshot.params['idVisit'];
    this.isNew = !this.idVisit;
    this.currentSite = this.storeService.getCurrentSite();
    this.intitForm();
    if (!this.currentSite) {
      forkJoin([
        this.nomenclatureServ.getNomenclature('STRATE_PLACETTE', null, null, null, {
          orderby: 'label_default',
        }),
        this._api.getOneTransect(this.idSite),
      ]).subscribe(
        results => {
          this.strates = results[0].values;
          this.renameKey(this.strates);
          this.currentSite = results[1];
          this.id_base_site = this.currentSite.properties.id_base_site;
          this.plotId = this.currentSite.properties.cor_plots[0].id_plot;
          this.plotTitle = this.currentSite.properties.cor_plots[0].code_plot;
          this._api.getTaxonsByHabitat(this.currentSite.properties.cd_hab).subscribe(taxons => {
            this.taxons = taxons;
            if (!this.isNew) {
              this.getVisit();
              this.submit_label = 'Modifier la visite';
            } else {
              this.userService.check_user_cruved_visit('C', this.visit).subscribe(ucruved => {
                this.addIsAllowed = ucruved;
                this.loadForm = true;
              });
              this.disabledForm = false;
              this.visit = this._api.getDefaultVisit();
              this.submit_label = 'Enregistrer la visite';
            }
          });
        },
        error => {
          this.toastr.error(
            'Une erreur est survenue lors de la récupération des informations sur le serveur.',
            '',
            { positionClass: 'toast-top-right' }
          );
        }
      );
    } else {
      this.plotId = this.currentSite.properties.cor_plots[0].id_plot;
      this.plotTitle = this.currentSite.properties.cor_plots[0].code_plot;
      this.id_base_site = this.currentSite.properties.id_base_site;
      forkJoin([
        this.nomenclatureServ.getNomenclature('STRATE_PLACETTE', null, null, null, {
          orderby: 'label_default',
        }),
        this._api.getTaxonsByHabitat(this.currentSite.properties.cd_hab),
      ]).subscribe(
        results => {
          this.strates = results[0].values;
          this.renameKey(this.strates);
          this.taxons = results[1];
          if (!this.isNew) {
            this.getVisit();
            this.submit_label = 'Modifier la visite';
          } else {
            this.userService.check_user_cruved_visit('C', this.visit).subscribe(ucruved => {
              this.addIsAllowed = ucruved;
              this.loadForm = true;
            });
            this.disabledForm = false;
            this.visit = this._api.getDefaultVisit();
            this.submit_label = 'Enregistrer la visite';
          }
        },
        error => {
          this.toastr.error(
            'Une erreur est survenue lors de la récupération des informations sur le serveur.',
            '',
            { positionClass: 'toast-top-right' }
          );
        }
      );
    }
  }

  ngAfterViewChecked() {
    if (this.loadForm !== false && this.checked == 0) {
      this.checked++;
      this.patchForm();
    }
  }

  private renameKey(strates) {
    strates.forEach(element => {
      element.id_nomenclature_strate = element.id_nomenclature;
      delete element.id_nomenclature;
    });
  }

  private getVisit() {
    this._api.getOneVisit(this.idVisit).subscribe(
      data => {
        this.visit = data;
        this.userService.check_user_cruved_visit('U', this.visit).subscribe(ucruved => {
          this.updateIsAllowed = ucruved;
        });
        this.visit.perturbations = null;
        if (this.visit.cor_visit_perturbation) {
          this.visit.perturbations = this.visit.cor_visit_perturbation.map(
            perturbation => perturbation.t_nomenclature
          );
        }
        this.patchForm();
        this.plots = _.clone(this.visit.cor_releve_plot);
        this.selectedPlot = this.visit.cor_releve_plot.find(plot => {
          return plot.id_plot == this.plotId;
        });
        this.currentSite.properties.cor_plots.map(plotlist => {
          if (
            !this.visit.cor_releve_plot.find(plot => {
              return plot.id_plot == plotlist.id_plot;
            })
          )
            plotlist.isEmpty = true;
        });
        this.visit_name = 'Visite N°' + this.visit.id_base_visit;
      },
      error => {
        if (error.status != 404) {
          this.toastr.error('Une erreur est survenue lors du chargement de votre relevé', '', {
            positionClass: 'toast-top-right',
          });
        }
      }
    );
  }

  getPlotReleve(plotReleve) {
    this.currentSite.properties.cor_plots.map(plot => {
      if (plot.id_plot == plotReleve[0].id_plot) {
        plot.status = plotReleve[0].status;
        if (plotReleve[1] == true) {
          plot.isModifided = plotReleve[1];
          plot.isEmpty = false;
        }
      }
    });

    let index = _.findIndex(this.plots, { id_plot: plotReleve[0].id_plot });
    if (index >= 0) {
      this.plots.splice(index, 1, plotReleve[0]);
    } else this.plots.push(plotReleve[0]);

    if (
      _.find(this.plots, plot => {
        return plot.status == false;
      })
    )
      this.visitForm.controls['plots'].setErrors({ incorrect: true });
    else this.visitForm.controls['plots'].setErrors(null);
  }

  backToVisites() {
    this.router.navigate([`${this.config['MHS']['MODULE_URL']}/transects`, this.id_base_site]);
  }

  onChangePlot(plot) {
    this.spinner = true;
    this.plotId = plot.id_plot;
    this.plotTitle = this.currentSite.properties.cor_plots.find(plot => {
      return plot.id_plot == this.plotId;
    }).code_plot;
    this.selectedPlot = this.plots.find(plot => {
      return plot.id_plot == this.plotId;
    });
    setTimeout(() => {
      this.spinner = false;
    }, 300);
  }

  isActive(plot) {
    return this.plotId === plot.id_plot;
  }

  private intitForm() {
    this.visitForm = this.formBuilder.group({
      id_base_visit: null,
      visit_date_min: [null, Validators.required],
      observers: [null, Validators.required],
      perturbations: new Array(),
      plots: null,
    });
    this.visitForm.controls['plots'].statusChanges.subscribe(status => {});
  }

  onSubmitVisit() {
    if (this.visitForm.valid) {
      let preparedData = {};
      preparedData['id_base_visit'] = this.visitForm.value['id_base_visit'];
      preparedData['observers'] = this.visitForm.value['observers'].map(obs => {
        return obs.id_role;
      });
      if (this.visitForm.value['perturbations'])
        preparedData['perturbations'] = this.visitForm.value['perturbations'].map(perturbation => {
          if (!perturbation.hasOwnProperty('id_nomenclature_perturb')) {
            return { id_nomenclature_perturb: perturbation.id_nomenclature };
          } else {
            return { id_nomenclature_perturb: perturbation.id_nomenclature_perturb };
          }
        });
      preparedData['visit_date_min'] = this.dateParser.format(
        this.visitForm.value['visit_date_min']
      );
      preparedData['id_base_site'] = this.id_base_site;
      this.plots.map(plot => {
        delete plot.status;
      });
      preparedData['plots'] = this.plots;
      this.sendFormData(preparedData);
    }
  }

  private sendFormData(preparedData) {
    if (this.isNew) {
      this._api.addVisit(preparedData).subscribe(
        result => this.onDataSavedSuccess(result),
        error => this.onDataSavedError(error)
      );
    } else {
      this._api.updateVisit({ idVisit: this.idVisit, data: preparedData }).subscribe(
        result => this.onDataSavedSuccess(result),
        error => this.onDataSavedError(error)
      );
    }
  }

  private onDataSavedSuccess(result) {
    this.toastr.success('Visite enregistrée avec succès', '', {
      positionClass: 'toast-top-right',
    });
    this.backToVisites();
  }

  private onDataSavedError(error) {
    if (error.status === 409 && error.error.description.startsWith('PostYearError')) {
      this.visitForm.controls['visit_date_min'].setErrors({ dateExisit: true });
      const title = 'Une visite existe déjà sur ce site pour cette année !';
      const msg = this.isNew
        ? "Veuillez plutôt éditer l'ancienne visite."
        : "Veuiller corriger l'année de la date de cette visite.";
      const options = {
        positionClass: 'toast-top-center',
        timeOut: 5000,
      };
      this.toastr.warning(msg, title, options);
    } else {
      this.commonService.translateToaster('error', 'ErrorMessage');
    }
    console.log(error);
  }

  onEdit() {
    this.disabledForm = !this.disabledForm;
    if (!this.disabledForm) {
      this.edit_btn = 'Annuler';
    } else {
      this.visitForm.reset();
      this.plots = _.clone(this.visit.cor_releve_plot);
      this.currentSite.properties.cor_plots.map(plotlist => {
        plotlist.isModifided = false;
        if (
          !this.visit.cor_releve_plot.find(plot => {
            return plot.id_plot == plotlist.id_plot;
          })
        )
          plotlist.isEmpty = true;
      });
      this.patchForm();
      this.edit_btn = 'Editer';
    }
  }

  private patchForm() {
    this.visitForm.patchValue({
      id_base_visit: this.idVisit,
      visit_date_min: this.dateParser.parse(this.visit.visit_date_min),
      observers: this.visit.observers,
      perturbations: this.visit.perturbations,
    });
    this.loadForm = true;
  }

  resizeCard() {
    return this.updateIsAllowed || this.addIsAllowed;
  }
}
