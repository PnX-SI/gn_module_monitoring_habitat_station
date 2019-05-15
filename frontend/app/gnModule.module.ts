import { NgModule } from "@angular/core";
import { CommonModule } from '@angular/common';
import { Routes, RouterModule } from "@angular/router";
import { HttpClient } from '@angular/common/http';
import { GN2CommonModule } from "@geonature_common/GN2Common.module";

// Service
import { DataService } from './services/data.service';
import { StoreService } from './services/store.service';
import { FormService } from './services/form.service';
import { UserService } from './services/user.service';

import { SiteMapListComponent } from "./site-map-list/site-map-list.component";
import { ListVisitComponent } from "./list-visit/list-visit.component";
import { ReleveComponent } from "./releve/releve.component";
import { PlotReleveComponent } from "./plot_relev/plot_relev.component";


// my module routing
const routes: Routes = [
  { path: "", component: SiteMapListComponent },
  { path: 'transects/new_transect', component: ListVisitComponent },
  { path: 'transects/:idSite', component: ListVisitComponent },
  { path: 'transects/:idSite/visit/:idVisit', component: ReleveComponent },
  { path: 'transects/:idSite/new_visit', component: ReleveComponent }
];

@NgModule({
  declarations: [
    SiteMapListComponent,
    ListVisitComponent,
    ReleveComponent,
    PlotReleveComponent,
  ],
  imports: [
    GN2CommonModule,
    RouterModule.forChild(routes),
    CommonModule
  ],
  providers: [
    HttpClient,
    DataService,
    StoreService,
    FormService,
    UserService
  ],
  bootstrap: []
})
export class GeonatureModule { }
