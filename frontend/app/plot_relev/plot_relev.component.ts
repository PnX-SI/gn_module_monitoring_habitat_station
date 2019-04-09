import { Component, OnInit, Output, Input, EventEmitter } from "@angular/core";
import { FormGroup, FormBuilder, FormArray } from "@angular/forms";

@Component({
    selector: "plot_relev",
    templateUrl: "plot_relev.component.html",
    styleUrls: ["./plot_relev.component.scss"]
})

export class PlotReleveComponent implements OnInit {

    @Input() taxons: any[];
    @Input() strates: any[];
    @Input() id_plot: number;
    @Output() plotReleve = new EventEmitter();
    public plotForm: FormGroup;

    constructor(
        private _fb: FormBuilder,
    ) {


    }

    ngOnInit() {
        this.initPlots();
        this.initTaxon();
        this.initStrates();
    }

    initPlots() {
        this.plotForm = this._fb.group({
            taxons_releve: this._fb.array([]),
            strates_releve: this._fb.array([]),
            excretes_presence: null
        });
    }

    initTaxon(): void {
        this.taxons.forEach(taxon => {
            (this.plotForm.get('taxons_releve') as FormArray).push(
                this._fb.group({
                    cd_nom: [taxon.cd_nom],
                    cover_pourcentage: [null],
                    nom_complet: [taxon.nom_complet]
                })
            );
        });
    }

    initStrates(): void {
        this.strates.forEach(strate => {
            (this.plotForm.get('strates_releve') as FormArray).push(
                this._fb.group({
                    id_nomenclature: [strate.id_nomenclature],
                    cover_pourcentage: [null],
                    label_default: [strate.label_default]
                })
            );
        });
    }

    onBlurMethod() {
        this.plotReleve.emit({ id_plot: this.id_plot, plot_data: this.plotForm.value });
    }
}
