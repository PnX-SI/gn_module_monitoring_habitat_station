import { Component, OnInit, Output, Input, EventEmitter, OnChanges } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, FormControl, Validators } from '@angular/forms';
import { ConfigService } from '@geonature/services/config.service';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'plot-releve',
  templateUrl: 'plot-releve.component.html',
  styleUrls: ['./plot-releve.component.scss'],
})
export class PlotReleveComponent implements OnInit, OnChanges {
  @Input() taxons: any[] = [];
  @Input() strates: any[];
  @Input('plot-id') plotId: number;
  @Input() data: any = null;
  @Input() disabledForm;
  @Input() title: string;
  @Output() plotReleve = new EventEmitter();
  private isModified: boolean = false;
  private relevePlotId;
  taxonApiEndPoint = `${this.config.API_TAXHUB}/taxref/search/lb_nom`;
  plotForm: FormGroup;
  scinameCodeControl: FormControl = new FormControl(null);
  hasStrateCovering: Boolean;
  hasTaxaCovering: Boolean;

  constructor(
    private formBuilder: FormBuilder,
    private config: ConfigService,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {
  }

  ngOnChanges() {
    this.hasStrateCovering = false;
    this.hasTaxaCovering = false;

    this.initPlots();
    this.initTaxon();
    this.initStrates();

    this.plotForm.enable();
    if (this.disabledForm) {
      this.plotForm.disable();
    }

    this.relevePlotId = null;
    if (this.data) {
      this.relevePlotId = this.data.id_releve_plot;
      this.patchForm();
    }

    this.onChanges();
  }

  private initPlots() {
    this.plotForm = this.formBuilder.group({
      taxons_releve: this.formBuilder.array([]),
      strates_releve: this.formBuilder.array([]),
      excretes_presence: false,
    });
  }

  private initTaxon(): void {
    this.taxons.sort((taxonA, taxonB) => taxonA.nom_complet.localeCompare(taxonB.nom_complet));

    this.taxons.forEach(taxon => {
      (this.plotForm.get('taxons_releve') as FormArray).push(
        this.formBuilder.group({
          id_cor_releve_plot_taxon: [null],
          cd_nom: [taxon.cd_nom],
          id_cor_hab_taxon: [taxon.id_cor_hab_taxon],
          cover_pourcentage: [null, Validators.compose([Validators.min(0), Validators.max(100)])],
          nom_complet: [taxon.nom_complet],
        })
      );
    });
  }

  private initStrates(): void {
    this.strates.sort((strateA, strateB) =>
      strateA.label_default.localeCompare(strateB.label_default)
    );

    this.strates.forEach(strate => {
      (this.plotForm.get('strates_releve') as FormArray).push(
        this.formBuilder.group({
          id_nomenclature_strate: [strate.id_nomenclature_strate],
          id_releve_plot_strat: [null],
          cover_pourcentage: [null, Validators.compose([Validators.min(0), Validators.max(100)])],
          label_default: [strate.label_default],
        })
      );
    });
  }

  private patchForm() {
    this.plotForm.patchValue({
      excretes_presence: this.data.plot_data.excretes_presence,
    });

    for (const item of this.data.plot_data.taxons_releve) {
      if (item.cover_pourcentage != null) {
        this.hasTaxaCovering = true;
      }

      let in_predefined_taxa = false;
      for (const releve of this.plotForm.get('taxons_releve')['controls']) {
        if (item.cd_nom == releve.value.cd_nom) {
          releve.patchValue({
            cd_nom: item.cd_nom,
            id_cor_releve_plot_taxon: item.id_cor_releve_plot_taxon,
            cover_pourcentage: item.cover_pourcentage,
          });
          in_predefined_taxa = true;
          break;
        }
      }
      if (!in_predefined_taxa) {
        (this.plotForm.get('taxons_releve') as FormArray).push(
          this.formBuilder.group({
            id_cor_releve_plot_taxon: [item.id_cor_releve_plot_taxon],
            cd_nom: [item.cd_nom],
            id_cor_hab_taxon: [null],
            cover_pourcentage: [
              item.cover_pourcentage,
              Validators.compose([Validators.min(0), Validators.max(100)]),
            ],
            nom_complet: [item.sciname.nom_complet_html],
          })
        );
      }
    }

    for (const item of this.data.plot_data.strates_releve) {
      if (item.cover_pourcentage != null) {
        this.hasStrateCovering = true;
      }

      for (const releve of this.plotForm.get('strates_releve')['controls']) {
        if (item.id_nomenclature_strate == releve.value.id_nomenclature_strate) {
          releve.patchValue({
            cover_pourcentage: item.cover_pourcentage,
            id_releve_plot_strat: item.id_releve_plot_strat,
          });
          break;
        }
      }
    }
  }

  private onChanges(): void {
    this.plotForm.valueChanges.subscribe(val => {
      this.isModified = true;
    });
  }

  onBlurMethod() {
    _.map(this.plotForm.value.strates_releve, strate => {
      if (this.relevePlotId) {
        strate.id_releve_plot = this.relevePlotId;
      }
      if (!strate.id_releve_plot_strat) {
        delete strate.id_releve_plot_strat;
      }
      delete strate.label_default;
    });
    _.map(this.plotForm.value.taxons_releve, taxon => {
      if (this.relevePlotId) {
        taxon.id_releve_plot = this.relevePlotId;
      }
      if (!taxon.id_cor_releve_plot_taxon) {
        delete taxon.id_cor_releve_plot_taxon;
      }
      delete taxon.nom_complet;
    });
    if (this.relevePlotId) {
      this.plotReleve.emit([
        {
          id_plot: this.plotId,
          id_releve_plot: this.relevePlotId,
          plot_data: this.plotForm.value,
          status: this.plotForm.valid,
        },
        this.isModified,
      ]);
    } else {
      this.plotReleve.emit([
        { id_plot: this.plotId, plot_data: this.plotForm.value, status: this.plotForm.valid },
        this.isModified,
      ]);
    }
    this.isModified = false;
  }

  addNewTaxon(event): void {
    let taxon = event.item;
    let taxonsCdNom = this.plotForm.get('taxons_releve').value.map(taxon => taxon.cd_nom.toString());
    if (!taxonsCdNom.includes(taxon.cd_nom.toString())) {
      (this.plotForm.get('taxons_releve') as FormArray).push(
        this.formBuilder.group({
          id_cor_releve_plot_taxon: [null],
          cd_nom: [taxon.cd_nom],
          id_cor_hab_taxon: [null],
          cover_pourcentage: [null, Validators.compose([Validators.min(0), Validators.max(100)])],
          nom_complet: [taxon.nom_complet_html],
        })
      );
    } else {
      let msg = 'Ce taxon est déjà renseigné dans la liste';
      this.toastr.warning(msg, '', { positionClass: 'toast-bottom-right' });
    }
    event.preventDefault();
    this.scinameCodeControl.reset();
  }
}
