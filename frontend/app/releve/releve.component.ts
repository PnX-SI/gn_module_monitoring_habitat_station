import { Component, OnInit } from "@angular/core";
import { NgbDateParserFormatter } from "@ng-bootstrap/ng-bootstrap";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { forkJoin } from "rxjs/observable/forkJoin";
import { ModuleConfig } from "../module.config";
import { DataService, IVisit } from "../services/data.service";
import { StoreService, ISite } from "../services/store.service";


@Component({
    selector: "releve",
    templateUrl: "releve.component.html",
    styleUrls: ["./releve.component.scss"]
})

export class ReleveComponent implements OnInit {

    dataLoaded: boolean = false;
    idVisit: number;
    visit: IVisit;
    isNew: boolean;
    public species = [];
    public nom_habitat;
    public id_base_site = 1;
    public strates = [];
    taxons;
    currentSite: ISite;
    plot: any;
    id_plot: number;
    visitForm: FormGroup;

    constructor(
        private activatedRoute: ActivatedRoute,
        public router: Router,
        private _fb: FormBuilder,
        public dateParser: NgbDateParserFormatter,
        private storeService: StoreService,
        private _api: DataService,

    ) {

    }

    ngOnInit() {
        this.idVisit = this.activatedRoute.snapshot.params['idSite'];
        this.currentSite = this.storeService.getCurrentSite();
        this.intitForm();
        console.log('currenSite 1', this.currentSite);
        if (!this.currentSite) {
            forkJoin([this._api.getStrates(), this._api.getSite(this.idVisit)])
                .subscribe(results => {
                    this.strates = results[0];
                    this.currentSite = results[1];
                    this.id_plot = this.currentSite.plots[0].id_plot;
                    this._api.getTaxons(this.currentSite.cd_hab).subscribe(
                        (taxons) => {
                            this.taxons = taxons;
                            console.log('currenSite 2', this.currentSite);
                            this.dataLoaded = true;
                        }
                    )
                });
        }
        else {
            this.id_plot = this.currentSite.plots[0].id_plot;
            forkJoin([this._api.getStrates(), this._api.getTaxons(this.currentSite.cd_hab)])
                .subscribe(results => {
                    this.strates = results[0];
                    this.taxons = results[1];
                    this.dataLoaded = true;
                });
        }
    }

    /* getVisit() {
        this._api.getOneVisit(this.idVisit).subscribe(
            data => {
                this.visit = data;
                this.intitForm();
                this.dataLoaded = true;
                console.log("visit", this.visit);
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
                this.dataLoaded = true;
            }
        );
    } */

    getPlotReleve(plotReleve) {
        console.log('plotReleve',plotReleve);
    }

    backToVisites() {
        this.router.navigate([`${ModuleConfig.MODULE_URL}/site`, this.id_base_site]);
    }

    onChangePlot(plot){
        console.log('p',plot);
        
        this.id_plot = plot.id_plot
    }

    intitForm() {
        this.visitForm = this._fb.group({
            visit_date_min: [null, Validators.required],
            observers: [null, Validators.required],
            perturbations: null,
        });
    }


    initPlots() {
        return this._fb.group({
            id_plot: [null, Validators.required],
            taxons_releve: this._fb.array([this.initTaxon_relev()]),
            strates_releve: this._fb.array([this.initSrate_relev()])
        });
    };

    initTaxon_relev() {
        return this._fb.group({
            id_taxon: [null, Validators.required],
            cover_porcentage: [0]
        });
    }

    initSrate_relev() {
        return this._fb.group({
            id_strate: [null, Validators.required],
            cover_porcentage: [0]
        });
    }

    /*pachForm() {
        this.formVisit.patchValue({
            visit_date_min: this.dateParser.parse(this.visit.visit_date_min),
            observers: this.visit.observers,
            perturbations: this.visit.perturbations,
           
        });
    };*/


}
