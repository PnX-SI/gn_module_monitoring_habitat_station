import { Routes } from '@angular/router';

import { ListVisitComponent } from './list-visit/list-visit.component';
import { ReleveComponent } from './releve/releve.component';
import { SiteMapListComponent } from './site-map-list/site-map-list.component';

// Module routing
export const routes: Routes = [
  { path: '', component: SiteMapListComponent },
  { path: 'transects/new_transect', component: ListVisitComponent },
  { path: 'transects/:idSite', component: ListVisitComponent },
  { path: 'transects/:idSite/visit/:idVisit', component: ReleveComponent },
  { path: 'transects/:idSite/new_visit', component: ReleveComponent },
];
