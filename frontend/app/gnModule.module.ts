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

@NgModule({
  declarations: [SiteMapListComponent, ListVisitComponent, ReleveComponent, PlotReleveComponent],
  imports: [GN2CommonModule, RouterModule.forChild(routes), CommonModule],
  providers: [HttpClient, DataService, StoreService, UserService],
  bootstrap: [],
})
export class GeonatureModule {}
