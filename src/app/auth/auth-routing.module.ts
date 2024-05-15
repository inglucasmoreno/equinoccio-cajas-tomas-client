import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginGuard } from '../guards/login.guard';

// Componentes
import { LoginComponent } from './login/login.component';

const routes: Routes = [
    { path: 'login', canActivate: [ LoginGuard ], component: LoginComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AuthRoutingModule {}

