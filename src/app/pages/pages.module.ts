import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { PagesComponent } from './pages.component';
import { AppRoutingModule } from '../app-routing.module';
import { SharedModule } from '../shared/shared.module';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { NuevoUsuarioComponent } from './usuarios/nuevo-usuario.component';
import { PipesModule } from '../pipes/pipes.module';
import { ComponentsModule } from '../components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditarUsuarioComponent } from './usuarios/editar/editar-usuario.component';
import { EditarPasswordComponent } from './usuarios/editar/editar-password.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { DirectivesModule } from '../directives/directives.module';
import { PerfilComponent } from './perfil/perfil.component';
import { UnidadMedidaComponent } from './unidad-medida/unidad-medida.component';
import { ProductosComponent } from './productos/productos.component';
import { ClientesComponent } from './clientes/clientes.component';
import { PresupuestosComponent } from './presupuestos/presupuestos.component';
import { NuevoPresupuestoComponent } from './presupuestos/nuevo-presupuesto.component';
import { FamiliaProductosComponent } from './familia-productos/familia-productos.component';
import { ProveedoresComponent } from './proveedores/proveedores.component';
import { VentasComponent } from './ventas/ventas.component';
import { NuevaVentaComponent } from './ventas/nueva-venta.component';
import { CajasComponent } from './cajas/cajas.component';
import { TiposMovimientosComponent } from './tipos-movimientos/tipos-movimientos.component';
import { MovimientosComponent } from './movimientos/movimientos.component';
import { CcClientesComponent } from './cc-clientes/cc-clientes.component';
import { CcProveedoresComponent } from './cc-proveedores/cc-proveedores.component';
import { CcClientesMovimientosComponent } from './cc-clientes/cc-clientes-movimientos.component';
import { CcProveedoresMovimientosComponent } from './cc-proveedores/cc-proveedores-movimientos.component';
import { BancosComponent } from './bancos/bancos.component';
import { ChequesComponent } from './cheques/cheques.component';
import { VentasPropiasComponent } from './ventas/ventas-propias.component';
import { CajasMovimientosComponent } from './cajas/cajas-movimientos.component';
import { CobrosComponent } from './cobros/cobros.component';
import { NuevoCobroComponent } from './cobros/nuevo-cobro.component';
import { GastosComponent } from './gastos/gastos.component';
import { GastosTiposComponent } from './gastos/gastos-tipos.component';
import { ComprasComponent } from './compras/compras.component';
import { NuevaCompraComponent } from './compras/nueva-compra.component';
import { PagosComponent } from './pagos/pagos.component';
import { NuevoPagoComponent } from './pagos/nuevo-pago.component';
import { MovimientosInternosComponent } from './movimientos-internos/movimientos-internos.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { PermisosComponent } from './usuarios/permisos/permisos.component';
import { NuevaVentaSimpleComponent } from './ventas/nueva-venta-simple.component';


@NgModule({
  declarations: [
    HomeComponent,
    PagesComponent,
    UsuariosComponent,
    NuevoUsuarioComponent,
    EditarUsuarioComponent,
    EditarPasswordComponent,
    PerfilComponent,
    UnidadMedidaComponent,
    ProductosComponent,
    ClientesComponent,
    PresupuestosComponent,
    NuevoPresupuestoComponent,
    FamiliaProductosComponent,
    ProveedoresComponent,
    VentasComponent,
    NuevaVentaComponent,
    CajasComponent,
    TiposMovimientosComponent,
    MovimientosComponent,
    CcClientesComponent,
    CcProveedoresComponent,
    CcClientesMovimientosComponent,
    CcProveedoresMovimientosComponent,
    BancosComponent,
    ChequesComponent,
    VentasPropiasComponent,
    CajasMovimientosComponent,
    CobrosComponent,
    NuevoCobroComponent,
    GastosComponent,
    GastosTiposComponent,
    ComprasComponent,
    NuevaCompraComponent,
    PagosComponent,
    NuevoPagoComponent,
    MovimientosInternosComponent,
    PermisosComponent,
    NuevaVentaSimpleComponent,
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    DirectivesModule,
    SharedModule,
    PipesModule,
    ComponentsModule,
    ReactiveFormsModule,
    NgxPaginationModule,
    FormsModule,
    DirectivesModule
  ]
})
export class PagesModule { }
