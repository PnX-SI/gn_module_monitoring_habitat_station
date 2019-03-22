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
        cor_visit_observer: [new Array(), Validators.required],
        cor_visit_perturbation: new Array(),
      });
      return formSuivi;
    }
}
