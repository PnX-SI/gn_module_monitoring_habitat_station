import { Injectable } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Injectable()
export class FormService {
  constructor(private _fb: FormBuilder) {}

  initFormTransect(): FormGroup {
    const formTransect = this._fb.group({
      id_base_site: [null, Validators.required],
      id_transect: [null, Validators.required],
      geom_end_lat: [null, Validators.required],
      geom_end_long: [null, Validators.required],
      geom_start_lat: [null, Validators.required],
      geom_start_long: [null, Validators.required],
      plot_size: [null, Validators.required],
      plot_shape: [null],
      transect_label: [null, Validators.required],
      cd_hab: [null, Validators.required],
      id_nomenclature_plot_position: [null, Validators.required],
    });
    return formTransect;
  }
}
