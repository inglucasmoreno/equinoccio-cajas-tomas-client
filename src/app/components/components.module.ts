import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PastillaEstadoComponent } from './pastilla-estado/pastilla-estado.component';
import { TarjetaListaComponent } from './tarjeta-lista/tarjeta-lista.component';
import { TarjetaFormularioComponent } from './tarjeta-formulario/tarjeta-formulario.component';
import { BotonRegresarComponent } from './boton-regresar/boton-regresar.component';
import { EncabezadoFormularioComponent } from './encabezado-formulario/encabezado-formulario.component';
import { AppRoutingModule } from '../app-routing.module';
import { BotonGenericoComponent } from './boton-generico/boton-generico.component';
import { BotonFormularioComponent } from './boton-formulario/boton-formulario.component';
import { BotonReportesComponent } from './boton-reportes/boton-reportes.component';
import { BotonTablaComponent } from './boton-tabla/boton-tabla.component';
import { TarjetaMiniComponent } from './tarjeta-mini/tarjeta-mini.component';
import { BotonIconoComponent } from './boton-icono/boton-icono.component';
import { PastillaPendienteCompletadoComponent } from './pastilla-pendiente-completado/pastilla-pendiente-completado.component';
import { ModalComponent } from './modal/modal.component';
import { ModalMediumComponent } from './modal-medium/modal-medium.component';
import { ModalSmallComponent } from './modal-small/modal-small.component';
import { PipesModule } from '../pipes/pipes.module';


@NgModule({
  declarations: [
    PastillaEstadoComponent,
    TarjetaListaComponent,
    TarjetaFormularioComponent,
    BotonRegresarComponent,
    EncabezadoFormularioComponent,
    BotonGenericoComponent,
    BotonFormularioComponent,
    BotonReportesComponent,
    BotonTablaComponent,
    TarjetaMiniComponent,
    BotonIconoComponent,
    PastillaPendienteCompletadoComponent,
    ModalComponent,
    ModalMediumComponent,
    ModalSmallComponent,
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    PipesModule
  ],
  exports: [
    PastillaEstadoComponent,
    TarjetaListaComponent,
    TarjetaFormularioComponent,
    BotonRegresarComponent,
    EncabezadoFormularioComponent,
    BotonGenericoComponent,
    BotonFormularioComponent,
    BotonReportesComponent,
    BotonTablaComponent,
    TarjetaMiniComponent,
    BotonIconoComponent,
    PastillaPendienteCompletadoComponent,
    ModalComponent,
    ModalMediumComponent,
    ModalSmallComponent
  ]
})
export class ComponentsModule { }
