import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Modulos
import { PagesRoutingModule } from './pages/pages-routing.module';
import { AuthRoutingModule } from './auth/auth-routing.module';

// Componentes
import { ErrorPageComponent } from './error-page/error-page.component';
import { InicializacionComponent } from './inicializacion/inicializacion.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard/home' },
  { path: 'init', component: InicializacionComponent },
  { path: '**', component: ErrorPageComponent }       
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    PagesRoutingModule,
    AuthRoutingModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
