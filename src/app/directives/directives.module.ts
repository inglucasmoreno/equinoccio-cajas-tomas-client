import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PermisosDirective } from './permisos.directive';



@NgModule({
  declarations: [
    PermisosDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PermisosDirective
  ]
})
export class DirectivesModule { }
