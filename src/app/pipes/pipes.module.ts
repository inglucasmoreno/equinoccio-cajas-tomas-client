import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FechaPipe } from './fecha.pipe';
import { RolPipe } from './rol.pipe';
import { MonedaPipe } from './moneda.pipe';
import { FiltroUsuariosPipe } from './filtro-usuarios.pipe';
import { FiltroUnidadMedidaPipe } from './filtro-unidad-medida.pipe';
import { FiltroClientesPipe } from './filtro-clientes.pipe';
import { FiltroFamiliaProductosPipe } from './filtro-familia-productos.pipe';
import { FiltroPresupuestosPipe } from './filtro-presupuestos.pipe';
import { FiltroProductosPipe } from './filtro-productos.pipe';
import { FiltroProveedoresPipe } from './filtro-proveedores.pipe';
import { CodigoPresupuestoPipe } from './codigo-presupuesto.pipe';
import { CodigoVentasPipe } from './codigo-ventas.pipe';
import { FiltroVentasPipe } from './filtro-ventas.pipe';
import { FiltroCajasPipe } from './filtro-cajas.pipe';
import { FiltroTiposMovimientosPipe } from './filtro-tipos-movimientos.pipe';
import { FiltroCcClientesPipe } from './filtro-cc-clientes.pipe';
import { FiltroCcProveedoresPipe } from './filtro-cc-proveedores.pipe';
import { FiltroCcClientesMovimientosPipe } from './filtro-cc-clientes-movimientos.pipe';
import { FiltroCcProveedoresMovimientosPipe } from './filtro-cc-proveedores-movimientos.pipe';
import { FiltroBancosPipe } from './filtro-bancos.pipe';
import { FiltroChequesPipe } from './filtro-cheques.pipe';
import { CodigoVentasPropiasPipe } from './codigo-ventas-propias.pipe';
import { FiltroCajasMovimientosPipe } from './filtro-cajas-movimientos.pipe';
import { CodigoReciboCobroPipe } from './codigo-recibo-cobro.pipe';
import { FiltroVentasPropiasPipe } from './filtro-ventas-propias.pipe';
import { FiltroTiposGastosPipe } from './filtro-tipos-gastos.pipe';
import { CodigoComprasPipe } from './codigo-compras.pipe';
import { FiltroProductosCompraPipe } from './filtro-productos-compra.pipe';
import { CodigoOrdenesPagoPipe } from './codigo-ordenes-pago.pipe';
import { LimitStringPipe } from './limit-string.pipe';

@NgModule({
  declarations: [
    FechaPipe,
    RolPipe,
    MonedaPipe,
    FiltroUsuariosPipe,
    FiltroUnidadMedidaPipe,
    FiltroClientesPipe,
    FiltroFamiliaProductosPipe,
    FiltroPresupuestosPipe,
    FiltroProductosPipe,
    FiltroProveedoresPipe,
    CodigoPresupuestoPipe,
    CodigoVentasPipe,
    FiltroVentasPipe,
    FiltroCajasPipe,
    FiltroTiposMovimientosPipe,
    FiltroCcClientesPipe,
    FiltroCcProveedoresPipe,
    FiltroCcClientesMovimientosPipe,
    FiltroCcProveedoresMovimientosPipe,
    FiltroBancosPipe,
    FiltroChequesPipe,
    CodigoVentasPropiasPipe,
    FiltroCajasMovimientosPipe,
    CodigoReciboCobroPipe,
    FiltroVentasPropiasPipe,
    FiltroTiposGastosPipe,
    CodigoComprasPipe,
    FiltroProductosCompraPipe,
    CodigoOrdenesPagoPipe,
    LimitStringPipe,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    FechaPipe,
    RolPipe,
    MonedaPipe,
    FiltroUsuariosPipe,
    FiltroUnidadMedidaPipe,
    FiltroClientesPipe,
    FiltroFamiliaProductosPipe,
    FiltroPresupuestosPipe,
    FiltroProductosPipe,
    FiltroProveedoresPipe,
    CodigoPresupuestoPipe,
    CodigoVentasPipe,
    FiltroVentasPipe,
    FiltroCajasPipe,
    FiltroTiposMovimientosPipe,
    FiltroCcClientesPipe,
    FiltroCcProveedoresPipe,
    FiltroCcClientesMovimientosPipe,
    FiltroCcProveedoresMovimientosPipe,
    FiltroBancosPipe,
    FiltroChequesPipe,
    CodigoVentasPropiasPipe,
    FiltroCajasMovimientosPipe,
    CodigoReciboCobroPipe,
    FiltroVentasPropiasPipe,
    FiltroTiposGastosPipe,
    CodigoComprasPipe,
    FiltroProductosCompraPipe,
    CodigoOrdenesPagoPipe,
    LimitStringPipe
  ]
})
export class PipesModule { }
