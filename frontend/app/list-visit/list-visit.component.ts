import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs/observable/forkJoin';
import * as _ from 'lodash';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { PlotNode, FlatPlotNode } from '../shared/models/plot-node.model';

import { DataFormService } from '@geonature_common/form/data-form.service';
import { MapListService } from '@geonature_common/map-list/map-list.service';
import { ConfigService } from '@geonature/services/config.service';

import { DataService } from '../shared/services/data.service';
import { StoreService } from '../shared/services/store.service';
import { UserService } from '../shared/services/user.service';
import { Page } from '../shared/models/page.model';
import { ISite } from '../shared/models/site.model';


@Component({
  selector: 'pnx-list-visit',
  templateUrl: 'list-visit.component.html',
  styleUrls: ['./list-visit.component.scss'],
})
export class ListVisitComponent implements OnInit, OnDestroy {
  public selectedStation: any = null;
  public currentSite: ISite;
  public sites;
  public stations = [];
  plots = [];
  transect_title: string = 'Consultation du transect ';
  public show = true;
  public idSite;
  public disabledForm = true;
  public rows = [];
  public page = new Page();
  public paramApp = this.storeService.queryString.append(
    'id_application',
    '' + this.config['MHS']['MODULE_CODE']
  );
  public upIsAllowed = false;
  addIsAllowed = false;
  dataLoaded = false;
  formTransect: FormGroup;
  formSensor : FormGroup;
  edit_btn: string = 'Editer';
  habitats: any;
  isNew: boolean;
  plot_position: any;
  addVisitIsAllowed = false;
  formPlot: FormGroup;
  private modalRef: NgbModalRef;
  public sensors = [];
  public sensorToDeleteIndex: number = null;
  sensorToDelete: number = null;
  private confirmModalRef: NgbModalRef;
  public sensorToEdit: number = null;
  public sensorToEditIndex: number = null;
  public plotHierarchy = [];
  public expandedPlots: {[key: number]: boolean} = {};
  public subplots = [];
  plotToDelete: number = null;
  plotToDeleteIndex:number=null;
  private confirmPlotModalRef: NgbModalRef;
  plotToEdit: any = null;
  plotToEditIndex: number = null;
  formStation: FormGroup;
  formEditPlot: FormGroup;
  formEditStation: FormGroup;
  private plotIdCounter : number =0;
  public stationToEdit:any;
  plotToDeleteObject: any = null;
   private _transformer = (node: PlotNode, level: number): FlatPlotNode => ({
    expandable: !!node.sub_plots && node.sub_plots.length > 0,
    id_plot: node.id_plot,
    code_plot: node.code_plot,
    distance_plot: node.distance_plot,
    level: level,
  });

  treeControl = new FlatTreeControl<FlatPlotNode>(
      node => node.level,
      node => node.expandable
  );

  treeFlattener = new MatTreeFlattener(
      this._transformer,
      node => node.level,
      node => node.expandable,
      node => node.sub_plots
  );

  plotDataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: FlatPlotNode) => node.expandable;
  constructor(
    private config: ConfigService,
    public storeService: StoreService,
    private api: DataService,
    public activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    public mapListService: MapListService,
    private modalService: NgbModal,
    public router: Router,
    private userService: UserService,
    private nomenclatureServ: DataFormService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.idSite = this.activatedRoute.snapshot.params['idSite'];
    this.isNew = !this.idSite;
    this.storeService.queryString = this.storeService.queryString.set('id_base_site', this.idSite);
    this.checkPermission();

    forkJoin([
      this.api.getAllSites({ id_base_site: this.idSite }),
      this.api.getHabitats(),
      this.nomenclatureServ.getNomenclature('POSITION_PLACETTE', null, null, null, {
        orderby: 'label_default',
      }),
      this.api.getAllStations(),
    ]).subscribe(
      results => {
        this.sites = results[0];
        this.habitats = results[1];
        this.plot_position = results[2] ? results[2].values : [];
        this.stations = results[3][1].features;
        this.formTransect = this.initFormTransect();
        if (!this.isNew) {
          this.loadTransect();
        } else {
          this.transect_title = 'Nouveau transect';
          this.dataLoaded = true;
          this.disabledForm = false;
        }
      },
      error => {
        const msg =
          error.error.message == 'sites_not_found'
            ? "Aucun site n'est disponible pour ajouter un nouveau transect."
            : 'Une erreur est survenue lors de la récupération des informations sur le serveur.';
        this.toastr.error(msg, '', { positionClass: 'toast-top-right' });
        this.router.navigate([`${this.config['MHS']['MODULE_URL']}/`]);
      }
    );
  }

  onRowSelect(e) {
    this.onVisitDetails(e.selected[0].id_base_visit);
  }

  checkPermission() {
    this.userService.check_isAdmin('U').subscribe(ucruved => {
      this.upIsAllowed = ucruved;
    });
    this.userService.check_isAdmin('C').subscribe(ucruved => {
      this.addIsAllowed = ucruved;
    });
    this.userService.check_user_cruved_visit('C').subscribe(ucruved => {
      this.addVisitIsAllowed = ucruved;
    });
  }

  initFormTransect(): FormGroup {
    const formTransect = this.formBuilder.group({
      id_base_site: [null],
      base_site_description: [null],
      id_transect: [null],
      geom_end_lat: [null, Validators.required],
      geom_end_long: [null, Validators.required],
      geom_start_lat: [null, Validators.required],
      geom_start_long: [null, Validators.required],
      plot_size: [null, Validators.required],
      plot_shape: [null],
      transect_label: [null, Validators.required],
      id_station: [null],
      id_nomenclature_plot_position: [null, Validators.required],
      azimut:[null],
      cd_hab:[null],
    });
    return formTransect;
  }

  getVisits() {
    this.api
      .getAllVisits(this.idSite)
      .pipe(
        map(data => {
          return data === null ? [{ totalItems: 0, itemsPerPage: 10 }, []] : data;
        })
      )
      .subscribe(
        data => {
          this.page.totalElements = data[0].totalItems;
          this.page.size = data[0].itemsPerPage;
          let visits = data[1] ? data[1] : [];
          visits.forEach(visit => {
            if (visit && visit.observers) {
              let fullName = '';
              let count = visit.observers.length;
              visit.observers.forEach((obs, index) => {
                if (count > 1) {
                  if (index + 1 == count) {
                    fullName += obs.nom_role + ' ' + obs.prenom_role;
                  } else {
                    fullName += obs.nom_role + ' ' + obs.prenom_role + ', ';
                  }
                } else {
                  fullName = obs.nom_role + ' ' + obs.prenom_role;
                }
              });
              visit.observers = fullName;
            }
          });
          this.rows = visits;
          this.dataLoaded = true;
        },
        error => {
          let notErrorStatus = [204, 404];
          if (!notErrorStatus.includes(error.status)) {
            this.toastr.error(
              'Une erreur est survenue lors de la récupération des informations sur le serveur.',
              '',
              { positionClass: 'toast-top-right' }
            );
          }
          this.dataLoaded = true;
        }
      );
  }

  private loadTransect() {
    this.api.getOneTransect(this.idSite).subscribe(
      site => {
        this.currentSite = site;
        if (!this.currentSite.properties?.cor_plots) {
          let msg = 'Ajouter des placettes à votre transect pour y associer des visites.';
          this.toastr.error(msg, '', { positionClass: 'toast-top-right' });
          this.addVisitIsAllowed = false;
        } else {
          this.plots = _.cloneDeep(this.currentSite.properties.cor_plots);
        }
        this.transect_title = this.transect_title + this.currentSite.properties?.transect_label;
        this.storeService.setCurrentSite(this.currentSite);
        this.getSensors();
        this.getPlots();
        this.pachForm();
        this.getVisits();
      },
      error => {
        let msg = '';
        if (error.status == 403) {
          msg = "Vous n'êtes pas autorisé à afficher ces données.";
        } else {
          msg = 'Une erreur est survenue lors de la récupération des informations sur le serveur.';
        }
        this.toastr.error(msg, '', { positionClass: 'toast-top-right' });
        
      }
    );
  }

  pachForm() {
    this.formTransect.patchValue({
      id_base_site: this.currentSite.properties.id_base_site,
      base_site_description: this.currentSite.properties.base_site_description,
      id_transect: this.currentSite.properties.id_transect,
      geom_start_lat: this.currentSite.geometry.coordinates[0][1],
      geom_start_long: this.currentSite.geometry.coordinates[0][0],
      geom_end_lat: this.currentSite.geometry.coordinates[1][1],
      geom_end_long: this.currentSite.geometry.coordinates[1][0],
      id_nomenclature_plot_position: this.currentSite.properties.plot_position.id_nomenclature,
      cd_hab: this.currentSite.properties.cd_hab,
      plot_size: this.currentSite.properties.plot_size,
      plot_shape: this.currentSite.properties.plot_shape,
      transect_label: this.currentSite.properties.transect_label,
      azimut: this.currentSite.properties.azimut,
      id_station: this.currentSite.properties.id_station,
    });
    if(this.currentSite.properties?.id_station){
      this.api.getOneStation(this.currentSite.properties.id_station).subscribe(
        (data:any)=>{
          this.selectedStation = data;
        }
      );
    }
  }

  backToSites() {
    this.router.navigate([`${this.config['MHS']['MODULE_URL']}/`]);
  }

  onNewVisit() {
    this.router.navigate([
      `${this.config['MHS']['MODULE_URL']}/transects/${this.currentSite.properties.id_base_site}/new_visit`,
    ]);
  }

  onVisitDetails(idVisit) {
    this.router.navigate([
      `${this.config['MHS']['MODULE_URL']}/transects/${this.currentSite.properties.id_base_site}/visit/`,
      idVisit,
    ]);
  }

  onAddPlot(content) {
    this.subplots = [];
    this.formPlot = this.formBuilder.group({
      code_plot: [null, Validators.required],
      distance_plot: [null, Validators.required],
      id_parent: [null],
    });
    this.formPlot.controls['id_parent'].valueChanges.subscribe(value =>{
      if(value !== null && value !== undefined){
        this.formPlot.controls['distance_plot'].clearValidators();

      }else{
        this.formPlot.controls['distance_plot'].setValidators(Validators.required);
      }
      this.formPlot.controls['distance_plot'].updateValueAndValidity();

    })
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  onAddSubPlot(){
    this.subplots = [...this.subplots, {code_plot: ''}];
  }
  onRemoveSubPlot(index : number ){
    this.subplots.splice(index, 1);
  }
 
findPlotById(plots : any[], id: number): any{
  for(let plot of plots){
    if (plot.temp_id === id){
      return plot;
    }
    if(plot.sub_plots?.length > 0){
      const found = this.findPlotById(plot.sub_plots, id);
      if(found) return found;
    }
  }
  return null;
} 

onSavePlot() {
    let plot = this.formPlot.value;
    
    if(this.isNew){
      plot.temp_id = this.plotIdCounter++;
      plot.sub_plots = [];
      if(plot.id_parent !== null && plot.id_parent !== undefined){
        const parent = this.findPlotById(this.plotHierarchy, plot.id_parent);
        if(parent){
          if(!parent.sub_plots) parent.sub_plots = [];
          parent.sub_plots.push(plot)
        }
      }else{
        this.plotHierarchy.push(plot);
      }
      this.plotHierarchy = [...this.plotHierarchy];
      this.modalRef.close();
      this.toastr.success('Placette ajoutée avec succès', '', { positionClass: 'toast-top-right' });
    }else{
      plot.id_transect = this.currentSite.properties?.id_transect;
      this.api.addPlot(plot).subscribe(
        data =>{
          this.getPlots();
          this.modalRef.close();
          this.toastr.success('Placette ajoutée avec succès', '', { positionClass: 'toast-top-right' });
        },
        error=>{
          this.toastr.error('Erreur lors de l \'ajout de la placette', '', {positionClass: 'toast-top-right'});
        }
      )
    }
}
      
onSaveAndContinuePlot() {
    let plot = this.formPlot.value;
    let savedParent = plot.id_parent;

    if(this.isNew){
      plot.temp_id = this.plotIdCounter++;
      plot.sub_plots = [];

      if (plot.id_parent !== null && plot.id_parent !== undefined) {
          const parent = this.findPlotById(this.plotHierarchy, plot.id_parent);
          if (parent) {
              if (!parent.sub_plots) parent.sub_plots = [];
              parent.sub_plots.push(plot);
          }
      } else {
          this.plotHierarchy.push(plot);
      }
      this.plotHierarchy = [...this.plotHierarchy];

      this.formPlot.patchValue({
                code_plot: null,
                distance_plot: null,
                id_parent: savedParent,
            });
      this.formPlot.markAsPristine();
      this.toastr.success('Placette ajoutée avec succès', '', { positionClass: 'toast-top-right' });
    }else{
      plot.id_transect = this.currentSite.properties?.id_transect;
      this.api.addPlot(plot).subscribe(
        data => {
            this.getPlots();
            this.formPlot.patchValue({
                code_plot: null,
                distance_plot: null,
                id_parent: savedParent,
            });
            this.formPlot.markAsPristine();
            this.toastr.success('Placette ajoutée avec succès', '', { positionClass: 'toast-top-right' });
        },
        error => {
            this.toastr.error('Erreur lors de l\'ajout de la placette', '', { positionClass: 'toast-top-right' });
        }
    );
    }
}

onEdit() {
    this.disabledForm = !this.disabledForm;
    if (!this.disabledForm) {
      this.edit_btn = 'Annuler';
    } else {
      this.plots = this.currentSite.properties.cor_plots;
      this.pachForm();
      this.edit_btn = 'Éditer';
    }
}

  onSubmitTransect() {
    let transect = this.formTransect.value;
    transect.cor_plots = this.isNew ? this.plotHierarchy: this.plots;
    

    transect.geom_start = `SRID=4326;POINT(${transect.geom_start_long} ${transect.geom_start_lat})`;
    transect.geom_end = `SRID=4326;POINT(${transect.geom_end_long} ${transect.geom_end_lat})`;
    delete transect.geom_end_long;
    delete transect.geom_start_long;
    delete transect.geom_end_lat;
    delete transect.geom_start_lat;

    if (this.isNew) {
      transect.sensors = this.sensors;
      this.api.addTransect(transect).subscribe(
        data => {
          this.toastr.success('Le transect a été ajouté avec succès', '', {
            positionClass: 'toast-top-right',
          });
          this.backToSites();
        },
        error => {
          this.toastr.error('Une erreur est survenue lors de la création du transect', '', {
            positionClass: 'toast-top-right',
          });
          this.backToSites();
        }
      );
    } else {
      this.api.updateTransect(transect).subscribe(
        data => {
          this.toastr.success('Le transect a été modifié avec succès', '', {
            positionClass: 'toast-top-right',
          });
          this.backToSites();
        },
        error => {
          this.toastr.error('Une erreur est survenue lors de la modification du transect', '', {
            positionClass: 'toast-top-right',
          });
          this.backToSites();
        }
      );
    }
  }
  getSensors(){
    this.api.getSensorsByTransect(this.currentSite.properties?.id_transect)
    .subscribe(
      data =>{

        this.sensors = data[1].sort((a, b) => 
        new Date(b.install_date).getTime() - new Date(a.install_date).getTime()
        );

      },
      error =>{
         this.toastr.error('Une erreur est survenue lors de la récupération des capteurs', '', {
            positionClass: 'toast-top-right',
          });

      }
    )
  }
  getPlots(){
    this.api.getPlotByTransect(this.currentSite.properties?.id_transect)
    .subscribe(
      data =>{
        this.plotHierarchy = data as any[];
        this.plotDataSource.data = this.plotHierarchy;
      },
      error =>{
        this.toastr.error('Erreur lors de la récupération des placettes', '', {
          positionClass : 'toast-top-right',
        });
      }
    )
  }
 togglePlot(id_plot: number){
    this.expandedPlots = {
        ...this.expandedPlots,
        [id_plot]: !this.expandedPlots[id_plot]
    };
  }

  onAddSensor(content){
    this.sensorToEdit = null; 
    this.formSensor = this.formBuilder.group({
      serial_number : [null, Validators.required],
      install_date:[null, Validators.required],

    });
    
    this.modalRef = this.modalService.open(content, {centered: true});
  }
  onSaveSensor(){
    let sensor = this.formSensor.value;

    if(this.isNew){
      if(this.sensorToEdit !== null){
        this.sensors[this.sensorToEditIndex] = sensor;
      }else{
        this.sensors.push(sensor);
      }
      this.modalRef.close();
    } else if (this.sensorToEdit) {
      
      sensor.id_sensor = this.sensorToEdit;
      sensor.id_transect = this.currentSite.properties?.id_transect;
      this.api.updateSensor(sensor).subscribe(
        data => {
          this.modalRef.close();
          this.getSensors();
          this.sensorToEdit = null;
          this.formTransect.markAsDirty();
          this.toastr.success('Capteur modifié avec succès', '', { positionClass: 'toast-top-right' });
        },
        error => {
          this.toastr.error('Erreur lors de la modification du capteur', '', { positionClass: 'toast-top-right' });
        }
      );
    } else {
      // Création d'un nouveau capteur
      sensor.id_transect = this.currentSite.properties?.id_transect;
      this.api.addSensor(sensor).subscribe(
        data => {
          this.modalRef.close();
          this.getSensors();
          this.formTransect.markAsDirty();
          this.toastr.success('Capteur ajouté avec succès', '', { positionClass: 'toast-top-right' });
        },
        error => {
          this.toastr.error('Erreur lors de l\'ajout du capteur', '', { positionClass: 'toast-top-right' });
        }
      );
    }
  }

  onDeleteSensor(id_sensor:any){
    this.api.deleteSensor(id_sensor).subscribe(
      data =>{
        this.getSensors();
        this.toastr.success('Capteur supprimé avec succès', '', { positionClass: 'toast-top-right' });
      },
      error =>{
      this.toastr.error('Erreur lors de la suppression du capteur', '', { positionClass: 'toast-top-right' });
    }
    )
   
  }
  onConfirmDelete(id_sensor:any, confirmContent:any, index?:number) {
    this.sensorToDelete = id_sensor;
    this.sensorToDeleteIndex = index;
    this.confirmModalRef = this.modalService.open(confirmContent, { centered: true });
  }

  onConfirmDeleteSensor() {
    if(this.isNew){
        this.sensors.splice(this.sensorToDeleteIndex, 1);
        this.confirmModalRef.close();
        this.toastr.success('Capteur supprimé avec succès', '', { positionClass: 'toast-top-right' });
    } else {
        this.onDeleteSensor(this.sensorToDelete);
        this.confirmModalRef.close();
    }
}
  onEditSensor(sensor:any, content:any, index?:number) {
    this.sensorToEdit = sensor.id_sensor;
    this.sensorToEditIndex = index;
    this.formSensor = this.formBuilder.group({
        serial_number: [sensor.serial_number, Validators.required],
        install_date: [sensor.install_date, Validators.required],
    });
    this.modalRef = this.modalService.open(content, { centered: true });
  }
  removePlot(plots: any[], target: any): boolean {
    const index = plots.indexOf(target);
    if (index !== -1) {
        plots.splice(index, 1);
        return true;
    }
    for (let plot of plots) {
        if (plot.sub_plots?.length > 0) {
            if (this.removePlot(plot.sub_plots, target)) return true;
        }
    }
    return false;
}

  onConfirmDeletePlot(id_plot: number, confirmContent: any, index?: number, plot?: any) {
    this.plotToDelete = id_plot;
    this.plotToDeleteIndex = index;
    this.plotToDeleteObject = plot;
    this.confirmPlotModalRef = this.modalService.open(confirmContent, { centered: true });
  }
 

onConfirmDeletePlotAction() {
    if(this.isNew){
        this.removePlot(this.plotHierarchy, this.plotToDeleteObject);
        this.plotHierarchy = [...this.plotHierarchy];
        this.confirmPlotModalRef.close();
        this.toastr.success('Placette supprimée avec succès', '', { positionClass: 'toast-top-right' });
    } else {
        this.api.deletePlot(this.plotToDelete).subscribe(
            data => {
                this.getPlots();
                this.confirmPlotModalRef.close();
                this.toastr.success('Placette supprimée avec succès', '', { positionClass: 'toast-top-right' });
            },
            error => {
                this.toastr.error('Erreur lors de la suppression de la placette', '', { positionClass: 'toast-top-right' });
            }
        );
    }
}

onEditPlot(plot: any, content: any, index?:number) {
    this.plotToEdit = plot;
    this.plotToEditIndex= index
    this.formEditPlot = this.formBuilder.group({
        code_plot: [plot.code_plot, Validators.required],
        distance_plot: [plot.distance_plot],
    });
    this.modalRef = this.modalService.open(content, { centered: true });
}

onSaveEditPlot() {
    let formValue = this.formEditPlot.value;

    if(this.isNew){
      Object.assign(this.plotToEdit, formValue);
      this.plotHierarchy = [...this.plotHierarchy];
      this.modalRef.close();
      this.toastr.success('Placette modifiée avec succès', '', { positionClass: 'toast-top-right' });
    }else{
      let plot = formValue;
      plot.id_plot = this.plotToEdit.id_plot;
      plot.id_transect = this.currentSite.properties?.id_transect;
        this.api.updatePlot(plot).subscribe(
        data => {
            this.modalRef.close();
            this.getPlots();
            this.toastr.success('Placette modifiée avec succès', '', { positionClass: 'toast-top-right' });
        },
        error => {
            this.toastr.error('Erreur lors de la modification de la placette', '', { positionClass: 'toast-top-right' });
        }
    );
    }
}
getParentCode(id_parent: any): string {
    if (this.isNew) {
        const parent = this.findPlotById(this.plotHierarchy, id_parent);
        return parent ? parent.code_plot : '';
    }
    const flatPlots = this.getFlatPlots(this.plotHierarchy);
    const parent = flatPlots.find(p => p.id_plot === id_parent);
    return parent ? parent.code_plot : '';
}
onSelectStation(id_station: any) {
    if (!id_station || id_station === 'null') {
        this.selectedStation = null;
        this.formTransect.patchValue({ id_station: null, cd_hab: null });
        return;
    }
    this.api.getOneStation(id_station).subscribe(
        (data: any) => {
            this.selectedStation = data;
            this.formTransect.patchValue({
                id_station: id_station,
                cd_hab: data.properties.cd_hab
            });
        },
        error => {
            this.toastr.error('Erreur lors de la récupération de la station', '', { positionClass: 'toast-top-right' });
        }
    );
}
onNewStation(content) {
    this.formStation = this.formBuilder.group({
        name: [null, Validators.required],
        remarks: [null],
        cd_hab: [null, Validators.required],
    });
    this.modalRef = this.modalService.open(content, { centered: true });
}

onSaveStation() {
    let station = this.formStation.value;
    this.api.addStation(station).subscribe(
        (data: any) => {
            this.stations.push(data);
            this.stations = this.stations.sort((a, b) => 
                a.properties.name.localeCompare(b.properties.name)
            );
            this.selectedStation = data;
            this.formTransect.patchValue({
                id_station: data.properties.id_station,
                cd_hab: data.properties.cd_hab,
            });
            this.modalRef.close();
            this.toastr.success('Station créée avec succès', '', { positionClass: 'toast-top-right' });
        },
        error => {
            this.toastr.error('Erreur lors de la création de la station', '', { positionClass: 'toast-top-right' });
        }
    );
}

getFlatPlots(plots: any[], depth: number = 1): any[] {
    const maxDepth = this.storeService.mhsConfig.max_plot_depth;
    let result = [];
    plots.forEach(plot => {
        if (depth < maxDepth) {
            result.push({...plot, depth});
            if (plot.sub_plots?.length > 0) {
                result = result.concat(this.getFlatPlots(plot.sub_plots, depth + 1));
            }
        }
    });
    return result;
}
onEditCurrentStation( content:any){
  this.stationToEdit = this.selectedStation;
  this.api.getOneStation(this.selectedStation.properties.id_station).subscribe(
    (data: any) =>{
      this.formEditStation = this.formBuilder.group({
        name: [data.properties.name, Validators.required],
        remarks: [data.properties.remarks],
        cd_hab: [data.properties.cd_hab, Validators.required],
      });
       this.modalRef = this.modalService.open(content, { centered: true });
    }
    
  )
}
onSaveEditCurrentStation(){
  let station = this.formEditStation.value;
  station.id_station = this.stationToEdit.properties.id_station;
  this.api.updateStation(station).subscribe(
    data => {
      this.modalRef.close();
      this.selectedStation= data;
      this.api.getAllStations().subscribe((result: any) => {
                this.stations = result[1].features.sort((a, b) =>
                    a.properties.name.localeCompare(b.properties.name)
                );
            });
      this.toastr.success('Station modifiée avec succès', '', { positionClass: 'toast-top-right' });
    },
    error=>{
      this.toastr.error('Erreur lors de la modification de la station', '', { positionClass: 'toast-top-right' });
    }
  )
}

  ngOnDestroy() {
    this.storeService.queryString = this.storeService.queryString.delete('id_base_site');
  }
}
