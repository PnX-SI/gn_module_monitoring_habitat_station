import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// GeoNature
import { GN2CommonModule } from '@geonature_common/GN2Common.module';

// Service
import { DataService } from './shared/services/data.service';
import { StoreService } from './shared/services/store.service';
import { UserService } from './shared/services/user.service';

// Components
import { SiteMapListComponent } from './site-map-list/site-map-list.component';
import { ListVisitComponent } from './list-visit/list-visit.component';
import { ReleveComponent } from './releve/releve.component';
import { PlotReleveComponent } from './plot-releve/plot-releve.component';


// Routes
import { routes } from './gnModule.routes';

//Angular Material

import {MatTreeModule} from '@angular/material/tree'
import {MatIconModule} from '@angular/material/icon'
import {MatButtonModule} from '@angular/material/button'
import {MatTableModule} from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { FrenchPaginatorIntl } from './shared/services/french-paginator-intl.service';
import {MatSortModule} from '@angular/material/sort'
import {MatProgressBarModule} from '@angular/material/progress-bar'




@NgModule({
  declarations: [SiteMapListComponent, ListVisitComponent, ReleveComponent, PlotReleveComponent],
  imports: [GN2CommonModule, RouterModule.forChild(routes), CommonModule, MatTreeModule, MatIconModule,MatButtonModule,MatTableModule, MatPaginatorModule, MatSortModule, MatProgressBarModule],
  providers: [HttpClient, DataService, StoreService, UserService, {provide: MatPaginatorIntl, useClass: FrenchPaginatorIntl}],
  bootstrap: [],
})
export class GeonatureModule {}
