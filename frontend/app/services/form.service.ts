import { Injectable } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { GeoJSON } from "leaflet";

@Injectable()
export class FormService {

    constructor(private _fb: FormBuilder) { }

    initFormSHS(): FormGroup {
      const formSuivi = this._fb.group({
        id_base_site: null,
        id_base_visit: null,
        visit_date_min: [null, Validators.required],
        cor_visit_observer: [null, Validators.required],
        cor_visit_perturbation: null,
        excretes_presence: null,
      });
      return formSuivi;
    }

    initFormTransect(): FormGroup {
      const formTransect = this._fb.group({
        id_base_site: null,
        id_transect: null,
        geom_end_lat: [null, Validators.required],
        geom_end_long: [null, Validators.required],
        geom_start_lat: [null, Validators.required],
        geom_start_long: [null, Validators.required],
        plot_size: null,
        transect_label: null,
        cd_hab: null,
        id_nomenclature_plot_position: null
      });
      return formTransect;
    }

  

}
