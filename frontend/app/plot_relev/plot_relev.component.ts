import { Component, OnInit, Output, Input, EventEmitter, OnChanges } from "@angular/core";
import { FormGroup, FormBuilder, FormArray, Validators } from "@angular/forms";
import * as _ from 'lodash';

@Component({
    selector: "plot_relev",
    templateUrl: "plot_relev.component.html",
    styleUrls: ["./plot_relev.component.scss"]
})

export class PlotReleveComponent implements OnInit, OnChanges {

    @Input() taxons: any[];
    @Input() strates: any[];
    @Input() id_plot: number;
    @Input() data: any = null;
    @Input() disabledForm;
    @Input() plot_title: string;
    @Output() plotReleve = new EventEmitter();
    public plotForm: FormGroup;
    isModifeded: boolean = false;
    id_releve_plot: number = null;

    constructor(
        private _fb: FormBuilder,
    ) {

    }

    ngOnChanges() {
        this.initPlots();
        this.initTaxon();
        this.initStrates();
        if (this.data) {
            this.id_releve_plot = this.data.id_releve_plot;
            this.patchForm();
        }
        else {
            this.id_releve_plot = null;
        }
        if (this.disabledForm)
            this.plotForm.disable();
        else
            this.plotForm.enable();
        this.onChanges();
    }

    ngOnInit() {
    }

    initPlots() {
        this.plotForm = this._fb.group({
            taxons_releve: this._fb.array([]),
            strates_releve: this._fb.array([]),
            excretes_presence: false
        });
    }

    patchForm() {
        this.plotForm.patchValue({
            'excretes_presence': this.data.plot_data.excretes_presence,
        });
        this.plotForm.get('taxons_releve')['controls'].forEach(releve => {
            this.data.plot_data.taxons_releve.forEach(item => {
                if (item.id_cor_hab_taxon == releve.value.id_cor_hab_taxon) {
                    releve.patchValue({
                        'id_cor_releve_plot_taxon': item.id_cor_releve_plot_taxon,
                        'cover_pourcentage': item.cover_pourcentage

                    });
                }
            })
        })
        this.plotForm.get('strates_releve')['controls'].forEach(releve => {
            this.data.plot_data.strates_releve.forEach(item => {
                if (item.id_nomenclature_strate == releve.value.id_nomenclature_strate) {
                    releve.patchValue({
                        'cover_pourcentage': item.cover_pourcentage,
                        'id_releve_plot_strat': item.id_releve_plot_strat
                    });
                }
            })
        })
    }

    initTaxon(): void {
        this.taxons.forEach(taxon => {
            (this.plotForm.get('taxons_releve') as FormArray).push(
                this._fb.group({
                    id_cor_releve_plot_taxon: [null],
                    id_cor_hab_taxon: [taxon.id_cor_hab_taxon],
                    cover_pourcentage: [null, Validators.compose([Validators.min(0), Validators.max(100)])],
                    nom_complet: [taxon.nom_complet]
                })
            );
        });
    }

    initStrates(): void {
        this.strates.forEach(strate => {
            (this.plotForm.get('strates_releve') as FormArray).push(
                this._fb.group({
                    id_nomenclature_strate: [strate.id_nomenclature_strate],
                    id_releve_plot_strat: [null],
                    cover_pourcentage: [null, Validators.compose([Validators.min(0), Validators.max(100)])],
                    label_default: [strate.label_default]
                })
            );
        });
    }

    onBlurMethod() {
        _.map(this.plotForm.value.strates_releve, (strate) => {
            if (this.id_releve_plot)
                strate.id_releve_plot = this.id_releve_plot;
            if (!strate.id_releve_plot_strat)
                delete strate.id_releve_plot_strat
            delete strate.label_default;
        });
        _.map(this.plotForm.value.taxons_releve, (taxon) => {
            if (this.id_releve_plot)
                taxon.id_releve_plot = this.id_releve_plot;
            if (!taxon.id_cor_releve_plot_taxon)
                delete taxon.id_cor_releve_plot_taxon
            delete taxon.nom_complet
        });
        if (this.id_releve_plot)
            this.plotReleve.emit([{ id_plot: this.id_plot, id_releve_plot: this.id_releve_plot, plot_data: this.plotForm.value, status: this.plotForm.valid }, this.isModifeded]);
        else
            this.plotReleve.emit([{ id_plot: this.id_plot, plot_data: this.plotForm.value, status: this.plotForm.valid }, this.isModifeded]);
        this.isModifeded = false
    }

    onChanges(): void {
        this.plotForm.valueChanges.subscribe(val => {
            this.isModifeded = true
        });
    }
}
