import {
  Component,
  OnInit,
  Input,
  Output,
  OnDestroy,
  EventEmitter
} from "@angular/core";
import {
  NgbModal,
  NgbModalRef,
  NgbDateParserFormatter
} from "@ng-bootstrap/ng-bootstrap";
import { FormGroup, FormBuilder, FormArray, NgForm } from "@angular/forms";
import { ToastrService } from "ngx-toastr";

import { forkJoin } from "rxjs/observable/forkJoin";
import { Observable } from "rxjs/Observable";

import { DataService } from "../services/data.service";
import { StoreService } from "../services/store.service";
import { FormService } from "../services/form.service";
import { UserService } from "../services/user.service";

@Component({
  selector: "modal-shs",
  templateUrl: "modal-shs.component.html",
  styleUrls: ["./modal-shs.component.scss"]
})
export class ModalSHSComponent implements OnInit, OnDestroy {
  @Input() labelButton: string;
  @Input() classStyle: string;
  @Input() iconStyle: string;
  @Input() idVisit: string;
  @Output() visitsUp = new EventEmitter();

  public formVisit: FormGroup;
  public formPlot: FormGroup;
  private _modalRef: NgbModalRef;
  public species = [];
  public cd_hab;
  public nom_habitat;
  public id_base_site;
  public strates = [];
  private _currentSite;
  private visit = {
    id_base_visit: "",
    visit_date_min: "",
    observers: [],
    plots:[{
      code_plot: "",
      id_plot: "",
      cor_releve_plot_taxons: [],
      cor_releve_plot_strats: []
    }],
    cor_visit_perturbation: [],
    excretes_presence: false
  };
  public modalTitle = "Saisie d'un relevé";
  public disabledForm = false;
  public onUpVisit = false;
  public labelUpVisit = "Editer le relevé";
  public isAllowed = false;

  constructor(
    private _modalService: NgbModal,
    public formService: FormService,
    public storeService: StoreService,
    private _api: DataService,
    private _fb: FormBuilder,
    public dateParser: NgbDateParserFormatter,
    private toastr: ToastrService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.labelButton = this.labelButton || "";

    this.formVisit = this.formService.initFormSHS();

    this.formPlot = this._fb.group({
      plots: this._fb.array([])
    })


    if (this.idVisit) {
      this.disabledForm = true;
    }

  }

  getDatas() {
    this._currentSite = this.storeService.getCurrentSite().subscribe(csite => {
      this.cd_hab = csite.cd_hab;
      this.nom_habitat = csite.nom_habitat;
      this.id_base_site = csite.id_base_site;
      this.visit.plots = csite.plots;
    });

    let datas = [];
    let currentVisit;
    if (this.idVisit) {
      currentVisit = this._api.getOneVisit(this.idVisit);
      this.modalTitle = "Relevé " + this.idVisit;
    } else {
      currentVisit = Observable.of([]);
    }
    datas.push(currentVisit);
    let taxons = this._api.getTaxons(this.cd_hab);
    datas.push(taxons);
    let strates = this._api.getStrates();
    datas.push(strates);

    forkJoin(datas).subscribe(results => {
      // results[0] is visit
      // results[1] is species
      // results[2] is strates
      this.visit = Object.keys(results[0]).length > 0 ? results[0] : this.visit; // TODO: type visit ?
      this.species = results[1];
      this.strates = results[2];
      this.pachForm();
    });
  }


  pachForm() {
    this.formVisit.patchValue({
      id_base_visit: this.visit.id_base_visit,
      visit_date_min: this.dateParser.parse(this.visit.visit_date_min),
      cor_visit_observer: this.visit.observers,
      cor_visit_perturbation: this.visit.cor_visit_perturbation,
      id_base_site: this.id_base_site,
      excretes_presence: this.visit.excretes_presence,
      plots: this.setPlots()
    });
  }

  setPlots() {
    let control = this.formPlot.controls.plots as FormArray;
    this.visit.plots.forEach(x => {
      control.push(this._fb.group({ 
        code_plot: x.code_plot,
        id_plot: x.id_plot,
        cor_releve_plot_taxons: this.setPlotTaxons(x),
        cor_releve_plot_strats: this.setPlotStrates(x)
      }))
    })
  }

  setPlotStrates(plot) {
    let arr = new FormArray([]);
    let plot_strats = {};
    let crps = plot.cor_releve_plot_strats;
    this.strates.forEach(st => {
      plot_strats['id_nomenclature_strate'] = st.id_nomenclature;
      plot_strats['mnemonique'] = st.mnemonique;
      plot_strats['label_default'] = st.label_default;
      plot_strats['cover_porcentage'] = 0;
      if(plot && plot.cor_releve_plot_strats && plot.cor_releve_plot_strats.length ) {
        crps.forEach(y => {
          if(st.id_nomenclature_strate = y.id_nomenclature) {
            plot_strats['cover_porcentage'] = y.cover_porcentage;
            plot_strats['id_releve_plot_strat'] = y.id_releve_plot_strat;
          }
        })
      }
      arr.push(this._fb.group(plot_strats));
    });

    return arr;
  }

  setPlotTaxons(plot) {
    let arr = new FormArray([]);
    let plot_taxon = {};
    let crps = plot.cor_releve_plot_taxons;
    this.species.forEach(specie => {
      plot_taxon['cd_nom'] = specie.cd_nom;
      plot_taxon['nom_complet'] = specie.nom_complet;
      plot_taxon['cover_porcentage'] = 0;
      if(plot && plot.cor_releve_plot_taxons && plot.cor_releve_plot_taxons.length) {
        crps.forEach(y => {
          if(y.cd_nom == specie.cd_nom) {
            plot_taxon['cover_porcentage'] = y.cover_porcentage;
            plot_taxon['id_cor_hab_taxon'] = y.id_cor_hab_taxon;
          }
        })
      }
      arr.push(this._fb.group(plot_taxon));
    })
    return arr;
  }

  addNewplot() {
    let control = <FormArray>this.formVisit.controls.plots;
    control.push(
      this._fb.group({
        plot: [''],
        cor_releve_plot_taxons: this._fb.array([]),
        cor_releve_plot_strats: this._fb.array([])
      })
    )
  }

  deletePlot(index) {
    let control = <FormArray>this.formVisit.controls.companies;
    control.removeAt(index)
  }

  initData() {
    this.getDatas();
  }

  open(content) {
    this._modalRef = this._modalService.open(content, { size: "lg" });
    this.initData();
  }

  onSave() {
    this.onClose();
    let currentForm = this.formateDataForm();
    /*if (this.idVisit) {
      this.patchVisit(currentForm);
    } else {
      this.postVisit(currentForm);
    }*/
  }

  formateDataForm() {
    const currentForm = this.formVisit.value;
    if (!this.idVisit) delete currentForm["id_base_visit"];
    currentForm["id_base_site"] = this.id_base_site;
    currentForm["visit_date_min"] = this.dateParser.format(
      this.formVisit.controls.visit_date_min.value
    );
    //cor_visit_perturbations
    if (
      currentForm["cor_visit_perturbation"] !== null &&
      currentForm["cor_visit_perturbation"] !== undefined
    ) {
      currentForm["cor_visit_perturbation"] = currentForm[
        "cor_visit_perturbation"
      ].map(pertu => {
        return { id_nomenclature_perturbation: pertu.id_nomenclature };
      });
    }
    //observers
    currentForm["cor_visit_observer"] = currentForm["cor_visit_observer"].map(
      obs => {
        return obs.id_role;
      }
    );

    return currentForm;
  }

  onClose() {
    this._modalRef.close();
    this.onUpVisit = false;
    if (this.idVisit) {
      this.disabledForm = true;
      this.labelUpVisit = "Editer le relevé";
    }
  }

  upVisit() {
    this.onUpVisit = !this.onUpVisit ? true : false;
    this.disabledForm = this.onUpVisit ? false : true;
    this.labelUpVisit = this.onUpVisit ? "Annuler" : "Editer le relevé";
    if (!this.onUpVisit) this._modalRef.close();
  }

  /*postVisit(currentForm) {
    this._api.postVisit(currentForm).subscribe(
      data => {
        this.visitsUp.emit(data);
        this.toastr.success("Le relevé est enregistré", "", {
          positionClass: "toast-top-right"
        });
      },
      error => {
        this.manageError(error);
      }
    );
  }

  patchVisit(currentForm) {
    this._api.patchVisit(currentForm, this.idVisit).subscribe(
      data => {
        this.visitsUp.emit(data);
        this.toastr.success("Le relevé a été modifié", "", {
          positionClass: "toast-top-right"
        });
      },
      error => {
        this.manageError(error);
      }
    );
  }*/

  manageError(error) {
    if (error.status == 403 && error.error.raisedError == "PostYearError") {
      this.toastr.error(error.error.message, "", {
        positionClass: "toast-top-right"
      });
    } else {
      this.toastr.error(
        "Une erreur est survenue lors de l'enregistrement de votre relevé",
        "",
        {
          positionClass: "toast-top-right"
        }
      );
    }
  }

  ngOnDestroy() {
    if (this._currentSite) this._currentSite.unsubscribe();
  }
}
