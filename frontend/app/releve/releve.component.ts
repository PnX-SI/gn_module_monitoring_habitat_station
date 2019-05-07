import { Component, OnInit } from "@angular/core";
import { NgbDateParserFormatter } from "@ng-bootstrap/ng-bootstrap";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin } from "rxjs/observable/forkJoin";
import { ModuleConfig } from "../module.config";
import { DataService, IVisit, Plot } from "../services/data.service";
import { StoreService, ISite } from "../services/store.service";
import { ToastrService } from "ngx-toastr";
import * as _ from 'lodash';

import { DataFormService } from "@geonature_common/form/data-form.service";

@Component({
    selector: "releve",
    templateUrl: "releve.component.html",
    styleUrls: ["./releve.component.scss"]
})

export class ReleveComponent implements OnInit {

    idSite: number;
    idVisit: number;
    loadForm: boolean = false;
    visit: IVisit;
    isNew: boolean;
    public species = [];
    public visit_name: string = "Nouvelle visite";
    public id_base_site: number;
    public strates = [];
    taxons;
    checked = 0;
    currentSite: ISite;
    plots: Plot[] = [];
    id_plot: number;
    visitForm: FormGroup;
    plot_title: string;
    submit_label: string;
    selectedPolt;
    spinner: boolean;

    constructor(
        private activatedRoute: ActivatedRoute,
        public router: Router,
        private _fb: FormBuilder,
        public dateParser: NgbDateParserFormatter,
        private storeService: StoreService,
        private _api: DataService,
        private toastr: ToastrService,
        private nomenclatureServ: DataFormService
    ) {
    }

    ngOnInit() {
        this.idSite = this.activatedRoute.snapshot.params['idSite'];
        this.idVisit = this.activatedRoute.snapshot.params['idVisit'];
        this.isNew = !this.idVisit;
        this.currentSite = this.storeService.getCurrentSite();
        this.intitForm();
        if (!this.currentSite) {
            forkJoin([
                this.nomenclatureServ.getNomenclature('STRATE_PLACETTE', null, null, { orderby: 'label_default' }),
                this._api.getTtransectByIdSite(this.idSite)
            ])
                .subscribe(results => {
                    this.strates = results[0].values;
                    this.renameKey(this.strates);
                    this.currentSite = results[1];
                    this.id_base_site = this.currentSite.properties.id_base_site;
                    this.id_plot = this.currentSite.properties.plots[0].id_plot;
                    this.plot_title = this.currentSite.properties.plots[0].code_plot;
                    this._api.getTaxonsByHabitat(this.currentSite.properties.cd_hab).subscribe(
                        (taxons) => {
                            this.taxons = taxons;
                            if (!this.isNew) {
                                this.getVisit();
                                this.submit_label = 'Modifier la visite';
                            }
                            else {
                                this.visit = this._api.getDefaultVisit();
                                this.submit_label = 'Enregistrer la visite';
                                this.loadForm = true;
                            }
                        }
                    )
                });
        }
        else {
            this.id_plot = this.currentSite.properties.plots[0].id_plot;
            this.plot_title = this.currentSite.properties.plots[0].code_plot;
            this.id_base_site = this.currentSite.properties.id_base_site;
            forkJoin([
                this.nomenclatureServ.getNomenclature('STRATE_PLACETTE', null, null, { orderby: 'label_default' }),
                this._api.getTaxonsByHabitat(this.currentSite.properties.cd_hab)
            ])
                .subscribe(results => {
                    this.strates = results[0].values;
                    this.renameKey(this.strates);
                    this.taxons = results[1];
                    if (!this.isNew) {
                        this.getVisit();
                        this.submit_label = 'Modifier la visite';
                    }
                    else {
                        this.visit = this._api.getDefaultVisit();
                        this.submit_label = 'Enregistrer la visite';
                        this.loadForm = true;
                    }
                });
        }

    }

    ngAfterViewChecked() {
        if (this.loadForm !== false && this.checked == 0) {
            this.checked++;
            this.patchForm();
        }
    }

    getVisit() {
        this._api.getVisitByID(this.idVisit).subscribe(
            data => {
                this.visit = data;
                if (this.visit.cor_visit_perturbation)
                    this.visit.cor_visit_perturbation.forEach(element => {
                        element.label_default = element.t_nomenclature.label_default
                        delete element.t_nomenclature
                    });
                else
                    this.visit.cor_visit_perturbation = null;
                this.patchForm();
                this.plots = this.visit.cor_releve_plot;
                this.selectedPolt = this.visit.cor_releve_plot.find((plot) => {
                    return plot.id_plot == this.id_plot
                });
                this.visit_name = "Visite N°" + this.visit.id_base_visit;
            },
            error => {
                if (error.status != 404) {
                    this.toastr.error(
                        "Une erreur est survenue lors du chargement de votre relevé",
                        "",
                        {
                            positionClass: "toast-top-right"
                        }
                    );
                }
            },
        );
    }

    getPlotReleve(plotReleve) {
        this.currentSite.properties.plots.map(
            (plot) => {
                if (plot.id_plot == plotReleve[0].id_plot)
                    if (plotReleve[1] == true)
                        plot.isModifided = plotReleve[1]
            }
        )
        let index = _.findIndex(this.plots, { id_plot: plotReleve[0].id_plot });
        if (index >= 0) {
            this.plots.splice(index, 1, plotReleve[0])
        }
        else
            this.plots.push(plotReleve[0])
    }

    backToVisites() {
        this.router.navigate([`${ModuleConfig.MODULE_URL}/transects`, this.id_base_site]);
    }

    onChangePlot(plot) {
        this.spinner = true;
        this.id_plot = plot.id_plot;
        this.plot_title = this.currentSite.properties.plots.find((plot) => {
            return plot.id_plot == this.id_plot
        }).code_plot;
        this.selectedPolt = this.plots.find((plot) => {
            return plot.id_plot == this.id_plot
        });
        setTimeout(() => {
            this.spinner = false
        }, 300);

    }

    isActive(plot) {
        return this.id_plot === plot.id_plot;
    }

    intitForm() {
        this.visitForm = this._fb.group({
            visit_date_min: [null, Validators.required],
            observers: [null, Validators.required],
            perturbations: new Array(),
        });
    }

    patchForm() {
        this.visitForm.patchValue({
            visit_date_min: this.dateParser.parse(this.visit.visit_date_min),
            observers: this.visit.observers,
            perturbations: this.visit.cor_visit_perturbation,
        });
        this.loadForm = true;
    }

    onSubmitVisit() {
        if (this.visitForm.valid) {
            this.visitForm.value["observers"] = this.visitForm.value["observers"].map(
                obs => { return obs.id_role }
            );
            if (this.visitForm.value["perturbations"])
                this.visitForm.value["perturbations"] = this.visitForm.value["perturbations"].map(
                    perturbation => {
                        if (!perturbation.hasOwnProperty('id_nomenclature_perturb'))
                            return { 'id_nomenclature_perturb': perturbation.id_nomenclature }
                        else
                            return { 'id_nomenclature_perturb': perturbation.id_nomenclature_perturb }
                    }
                );
            this.visitForm.value["visit_date_min"] = this.dateParser.format(this.visitForm.value["visit_date_min"]);
            this.visitForm.value["plots"] = this.plots;
            this.visitForm.value["id_base_site"] = this.id_base_site;
            if (this.isNew)
                this.postVisit()
            else
                this.updateVisit()
        }
    }

    postVisit() {
        this._api.postVisit(this.visitForm.value).subscribe(
            () => {
                this.visitForm.reset();
                this.toastr.success(
                    "la visite est enregitrée avec succès",
                    "",
                    {
                        positionClass: "toast-top-right"
                    }
                );
                this.backToVisites()
            },
            error => {
                if (error.status == 403 && error.error.raisedError == "PostYearError") {
                    this.visitForm.controls['visit_date_min'].setErrors({ dateExisit: true });
                    this.toastr.error(
                        "Une existe déja pour cette année",
                        "",
                        {
                            positionClass: "toast-top-right"
                        }
                    );
                }
            }
        )
    }

    updateVisit() {
        this.visitForm.value.id_base_visit = this.idVisit;
        this._api.updateVisit({ id_visit: this.idVisit, data: this.visitForm.value }).subscribe(
            () => {
                this.visitForm.reset();
                this.toastr.success(
                    "la visite est modifiée avec succès",
                    "",
                    {
                        positionClass: "toast-top-right"
                    }
                );
                this.backToVisites()
            },
            error => {
                if (error.status == 403 && error.error.raisedError == "PostYearError") {
                    this.visitForm.controls['visit_date_min'].setErrors({ dateExisit: true });
                    this.toastr.error(
                        "Une existe déja pour cette année",
                        "",
                        {
                            positionClass: "toast-top-right"
                        }
                    );
                }
            }
        )
    }
    renameKey(strates) {
        strates.forEach(element => {
            element.id_nomenclature_strate = element.id_nomenclature
            delete element.id_nomenclature
        });
    }


}
