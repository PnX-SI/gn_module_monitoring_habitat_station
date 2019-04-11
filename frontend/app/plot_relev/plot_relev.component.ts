import { Component, OnInit, Output, Input, EventEmitter ,OnChanges} from "@angular/core";
import { FormGroup, FormBuilder, FormArray } from "@angular/forms";

@Component({
    selector: "plot_relev",
    templateUrl: "plot_relev.component.html",
    styleUrls: ["./plot_relev.component.scss"]
})

export class PlotReleveComponent implements OnInit,OnChanges {

    @Input() taxons: any[];
    @Input() strates: any[];
    @Input() id_plot: number;
    @Input() data: any = null;
    @Input() plot_title: string;
    @Output() plotReleve = new EventEmitter();
    public plotForm: FormGroup;

    constructor(
        private _fb: FormBuilder,
    ) {

    }

    ngOnChanges() {
        this.initPlots();
        this.initTaxon();
        this.initStrates();
        if (this.data)
            this.patchForm()

    }

    ngOnInit() {
    }

    initPlots() {
        this.plotForm = this._fb.group({
            taxons_releve: this._fb.array([]),
            strates_releve: this._fb.array([]),
            excretes_presence: null
        });
    }

    patchForm() {
        this.plotForm.patchValue({
            'excretes_presence': this.data.plot_data.excretes_presence,
        });
        this.plotForm.get('taxons_releve').controls.forEach(releve => {
            this.data.plot_data.taxons_releve.forEach(item => {
                if (item.cd_nom == releve.value.cd_nom) {
                    releve.patchValue({
                        'cover_porcentage': item.cover_porcentage
                    });
                }
            })
        })
        this.plotForm.get('strates_releve').controls.forEach(releve => {
            this.data.plot_data.strates_releve.forEach(item => {
                if (item.id_nomenclature_strate == releve.value.id_nomenclature_strate) {
                    releve.patchValue({
                        'cover_porcentage': item.cover_porcentage
                    });
                }
            })
        })

    }

    initTaxon(): void {
        this.taxons.forEach(taxon => {
            (this.plotForm.get('taxons_releve') as FormArray).push(
                this._fb.group({
                    cd_nom: [taxon.cd_nom],
                    cover_porcentage: [null],
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
                    cover_porcentage: [null],
                    label_default: [strate.label_default]
                })
            );
        });
    }

    onBlurMethod() {
        this.plotReleve.emit({ id_plot: this.id_plot, plot_data: this.plotForm.value });
    }
}
