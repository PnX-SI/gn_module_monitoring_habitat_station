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

@Component({
    selector: "releve",
    templateUrl: "releve.component.html",
    styleUrls: ["./releve.component.scss"]
})

export class ReleveComponent implements OnInit {


    idSite: number;
    idVisit: number;
    visit: IVisit;
    isNew: boolean;
    public species = [];
    public visit_name: string = "Nouvelle visite";
    public id_base_site: number;
    public strates = [];
    taxons;
    currentSite: ISite;
    plots: Plot[] = [];
    id_plot: number;
    visitForm: FormGroup;
    plot_title: string;
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
    ) {

    }

    ngOnInit() {
        this.idSite = this.activatedRoute.snapshot.params['idSite'];
        this.idVisit = this.activatedRoute.snapshot.params['idVisit'];
        this.isNew = !this.idVisit;
        this.currentSite = this.storeService.getCurrentSite();
        this.intitForm();
        if (!this.currentSite) {
            forkJoin([this._api.getStrates(), this._api.getSiteByID(this.idSite)])
                .subscribe(results => {
                    this.strates = results[0];
                    this.currentSite = results[1];
                    this.id_base_site = this.currentSite.properties.id_base_site;
                    this.id_plot = this.currentSite.properties.plots[0].id_plot;
                    this.plot_title = this.currentSite.properties.plots[0].code_plot;
                    this._api.getTaxonsByHabitat(this.currentSite.properties.cd_hab).subscribe(
                        (taxons) => {
                            this.taxons = taxons;
                            if (!this.isNew) {
                                this.getVisit();
                            }
                            else {
                                this.visit = this._api.getDefaultVisit();
                            }
                        }
                    )
                });
        }
        else {
            this.id_plot = this.currentSite.properties.plots[0].id_plot;
            this.plot_title = this.currentSite.properties.plots[0].code_plot;
            this.id_base_site = this.currentSite.properties.id_base_site;
            forkJoin([this._api.getStrates(), this._api.getTaxonsByHabitat(this.currentSite.properties.cd_hab)])
                .subscribe(results => {
                    this.strates = results[0];
                    this.taxons = results[1];
                    if (!this.isNew) {
                        this.getVisit();
                    }
                    else {
                        this.visit = this._api.getDefaultVisit()
                    }
                });
        }
    }

    getVisit() {
        this._api.getOneVisit(this.idVisit).subscribe(
            data => {
                this.visit = data;
                this.selectedPolt = this.visit.plots.find((plot) => {
                    return plot.id_plot == this.id_plot
                });
                this.visit_name = "Visite N°" + this.visit.id_base_visit;
                this.pachForm();
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
            }
        );
    }

    getPlotReleve(plotReleve) {
        let index = _.findIndex(this.plots, { id_plot: plotReleve.id_plot });
        if (index >= 0) {
            this.plots.splice(index, 1, plotReleve)
        }
        else
            this.plots.push(plotReleve)
    }

    backToVisites() {
        this.router.navigate([`${ModuleConfig.MODULE_URL}/site`, this.id_base_site]);
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
            perturbations: null,
        });
    }

    pachForm() {
        this.visitForm.patchValue({
            visit_date_min: this.dateParser.parse(this.visit.visit_date_min),
            observers: this.visit.observers,
            perturbations: this.visit.cor_transect_visit_perturbation,
        });
    }

    onSubmitVisit(visitForm) {
        if (visitForm.valid) {
            this.visitForm.value["observers"] = visitForm.value["observers"].map(
                obs => { return obs.id_role }
            );
            if (visitForm.value["perturbations"])
                this.visitForm.value["perturbations"] = visitForm.value["perturbations"].map(
                    perturbation => { return { 'id_nomenclature_perturb': perturbation.id_nomenclature } }
                );
            this.visitForm.value["visit_date_min"] = this.dateParser.format(visitForm.value["visit_date_min"]);
            this.visitForm.value["plots"] = this.plots;
            this.visitForm.value["id_base_site"] = this.id_base_site;
            this._api.postVisit(this.visitForm.value).subscribe(
                () => this.visitForm.reset()
            )
        }
    }

}
