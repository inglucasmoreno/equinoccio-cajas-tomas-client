import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { CajasMovimientosService } from 'src/app/services/cajas-movimientos.service';
import { CajasService } from 'src/app/services/cajas.service';
import { ChequesService } from 'src/app/services/cheques.service';
import { ComprasChequesService } from 'src/app/services/compras-cheques.service';
import { ComprasProductosService } from 'src/app/services/compras-productos.service';
import { ComprasService } from 'src/app/services/compras.service';
import { DataService } from 'src/app/services/data.service';
import { GastosService } from 'src/app/services/gastos.service';
import { MovimientosInternosService } from 'src/app/services/movimientos-internos.service';
import { OrdenesPagoChequesService } from 'src/app/services/ordenes-pago-cheques.service';
import { OrdenesPagoCompraService } from 'src/app/services/ordenes-pago-compra.service';
import { OrdenesPagoService } from 'src/app/services/ordenes-pago.service';
import { RecibosCobroChequeService } from 'src/app/services/recibos-cobro-cheque.service';
import { RecibosCobroVentaService } from 'src/app/services/recibos-cobro-venta.service';
import { RecibosCobroService } from 'src/app/services/recibos-cobro.service';
import { VentasPropiasChequesService } from 'src/app/services/ventas-propias-cheques.service';
import { VentasPropiasProductosService } from 'src/app/services/ventas-propias-productos.service';
import { VentasPropiasService } from 'src/app/services/ventas-propias.service';
import { environment } from 'src/environments/environment';
import { saveAs } from 'file-saver-es';
import { format } from 'date-fns';
import { ReportesService } from 'src/app/services/reportes.service';

const base_url = environment.base_url;

@Component({
  selector: 'app-cajas-movimientos',
  templateUrl: './cajas-movimientos.component.html',
  styles: [
  ]
})
export class CajasMovimientosComponent implements OnInit {

  // Flags
  public textoCompleto: boolean = false;

  // Fechas
  public reportes = {
    fechaDesde: '',
    fechaHasta: '',
    caja: ''
  };

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalMovimiento = false;
  public showModalDetalles = false;
  public showModalDetallesMovimientoInterno = false;
  public showModalDetallesCobro = false;
  public showModalDetallesPago = false;
  public showModalDetallesVenta = false;
  public showModalDetallesCompra = false;
  public showModalDetallesCheque = false;
  public showModalDetallesGasto = false;
  public showModalReportesMovimientos = false;

  // Estado formulario
  public estadoFormulario = 'crear';

  // Caja
  public idCaja: string = '';
  public caja: any;

  // Movimiento
  public idMovimiento: string = '';
  public movimientos: any = [];
  public movimientoSeleccionado: any;

  // Data
  public descripcion: string = '';
  public tipo: string = 'Debe';
  public monto: number = null;

  // Paginacion
  public totalItems: number;
  public paginaActual: number = 1;
  public cantidadItems: number = 10;
  public desde: number = 0;

  // Venta propia y compras
  public compra: any;
  public ventaPropia: any;
  public productos: any[];
  public relaciones: any[];  // Relaciones venta_propia = cheques
  public chequeSeleccionado: any;
  public recibosCobro: any[];

  // Cobros
  public recibo_cobro: any = null;
  public recibo_ventas: any[] = [];
  public recibo_cheques: any[] = [];
  public totalEnVentas: any = 0;
  public ordenesPago: any[] = [];

  // Pagos
  public orden_pago: any = null;
  public pago_compras: any[] = [];
  public pago_cheques: any[] = [];
  public totalEnCompras: any = 0;

  // Movimiento interno
  public movimientoInternoSeleccionado: any;

  // Gastos
  public gastoSeleccionado: any = null;

  // Otros
  public origen: string = '';

  // Filtrado
  public filtro = {
    activo: 'true',
    parametro: '',
    parametroProducto: ''
  }

  // Ordenar
  public ordenar = {
    direccion: -1,  // Asc (1) | Desc (-1)
    columna: 'createdAt'
  }

  constructor(
    private movimientosService: CajasMovimientosService,
    private cobrosService: RecibosCobroService,
    private pagosService: OrdenesPagoService,
    private recibosCobroVentaService: RecibosCobroVentaService,
    private recibosCobroChequeService: RecibosCobroChequeService,
    private movimientosInternosService: MovimientosInternosService,
    private ventasPropiasService: VentasPropiasService,
    private comprasService: ComprasService,
    private ordenesPagoCompraService: OrdenesPagoCompraService,
    private ordenesPagoChequesService: OrdenesPagoChequesService,
    private ventasPropiasChequesService: VentasPropiasChequesService,
    private comprasChequesService: ComprasChequesService,
    private ventasPropiasProductosService: VentasPropiasProductosService,
    private comprasProductosService: ComprasProductosService,
    private gastosService: GastosService,
    private activatedRoute: ActivatedRoute,
    private cajasService: CajasService,
    public authService: AuthService,
    private chequesService: ChequesService,
    private alertService: AlertService,
    private reportesService: ReportesService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Cajas - Registros';
    this.activatedRoute.params.subscribe(({ id }) => { this.idCaja = id; });
    this.permisos.all = this.permisosUsuarioLogin();
    this.calculosIniciales();
  }

  // Calculos iniciales
  calculosIniciales(): void {
    this.alertService.loading();
    this.cajasService.getCaja(this.idCaja).subscribe({
      next: ({ caja }) => {
        this.caja = caja;
        this.reportes.caja = caja._id;
        this.listarMovimientos();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('CAJAS_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Abrir modal
  abrirModal(estado: string, movimiento: any = null): void {
    this.descripcion = '';
    this.tipo = 'Debe';
    this.monto = null;
    this.idMovimiento = '';

    if (estado === 'editar') this.getMovimiento(movimiento);
    else this.showModalMovimiento = true;

    this.estadoFormulario = estado;
  }

  // Traer datos de movimiento
  getMovimiento(movimiento: any): void {
    this.alertService.loading();
    this.idMovimiento = movimiento._id;
    this.movimientoSeleccionado = movimiento;
    this.movimientosService.getMovimiento(movimiento._id).subscribe(({ movimiento }) => {
      this.descripcion = movimiento.descripcion;
      this.alertService.close();
      this.showModalMovimiento = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar movimientos
  listarMovimientos(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      desde: this.desde,
      cantidadItems: this.cantidadItems,
      parametro: this.filtro.parametro,
      caja: this.idCaja
    }
    this.movimientosService.listarMovimientos(parametros)
      .subscribe(({ movimientos, totalItems }) => {
        console.log(movimientos);
        this.movimientos = movimientos;
        this.totalItems = totalItems;
        this.showModalMovimiento = false;
        this.alertService.close();
      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nuevo movimiento
  nuevoMovimiento(): void {

    // Verificacion: Descripción vacia
    if (this.descripcion.trim() === "") {
      this.alertService.info('Debes colocar una descripción');
      return;
    }

    // Verificacion: monto invalido
    if (this.descripcion.trim() === "") {
      this.alertService.info('Debes colocar un monto válido');
      return;
    }

    this.alertService.loading();

    const data = {
      descripcion: this.descripcion,
      caja: this.caja._id,
      monto: this.monto,
      tipo: this.tipo,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.movimientosService.nuevoMovimiento(data).subscribe(({ saldo_nuevo }) => {
      this.caja.saldo = saldo_nuevo;
      this.listarMovimientos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar movimiento
  actualizarMovimiento(): void {

    // Verificacion: Descripción vacia
    if (this.descripcion.trim() === "") {
      this.alertService.info('Debes colocar una descripción');
      return;
    }

    this.alertService.loading();

    const data = {
      descripcion: this.descripcion,
      updatorUser: this.authService.usuario.userId,
    }

    this.movimientosService.actualizarMovimiento(this.idMovimiento, data).subscribe(() => {
      this.listarMovimientos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });
  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(movimiento: any): void {

    const { _id, activo } = movimiento;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.movimientosService.actualizarMovimiento(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarMovimientos();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

  // Abrir modal - Detalles de movimientos
  abrirDetallesMovimientos(movimiento: any): void {
    this.movimientoSeleccionado = movimiento;
    this.movimientoSeleccionado = movimiento;
    this.showModalDetalles = true;
  }

  // Generar PDF
  generarPDF(venta: any): void {
    this.alertService.loading();
    this.ventasPropiasService.generarPDF({ venta: venta._id }).subscribe({
      next: () => {
        window.open(`${base_url}/pdf/venta-propia.pdf`, '_blank');
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Generar PDF compra
  generarPDFCompra(compra: any): void {
    this.alertService.loading();
    this.comprasService.generarPDF({ compra: compra._id }).subscribe({
      next: () => {
        window.open(`${base_url}/pdf/compra.pdf`, '_blank');
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Abrir detalles de venta
  abrirDetallesVenta(origen: string, venta_propia = ''): void {

    this.alertService.loading();

    this.origen = origen;

    this.ventasPropiasService.getVenta(venta_propia !== '' ? venta_propia : this.movimientoSeleccionado.venta_propia).subscribe({
      next: ({ venta }) => {
        this.ventaPropia = venta;

        this.ventasPropiasProductosService.listarProductos({ venta: venta._id }).subscribe({
          next: ({ productos }) => {
            this.productos = productos;

            this.ventasPropiasChequesService.listarRelaciones({ venta_propia: venta._id }).subscribe({
              next: ({ relaciones }) => {

                this.relaciones = relaciones;

                this.recibosCobroVentaService.listarRelaciones({ venta_propia: venta._id }).subscribe({
                  next: ({ relaciones }) => {

                    this.recibosCobro = relaciones;

                    this.showModalDetalles = false;
                    this.showModalDetallesCobro = false;
                    this.showModalDetallesVenta = true;
                    this.alertService.close();

                  }, error: ({ error }) => this.alertService.errorApi(error.message)
                })

              }, error: ({ error }) => this.alertService.errorApi(error.message)
            })

          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Cerrar detalles de venta
  cerrarDetallesVenta(): void {

    if (this.origen === 'venta') {
      this.showModalDetallesVenta = false;
      this.showModalDetalles = true;
    } else if (this.origen === 'cobro') {
      this.showModalDetallesVenta = false;
      this.showModalDetallesCobro = true;
    }

  }

  // Cerrar detalles de compra
  cerrarDetallesCompra(): void {

    if (this.origen === 'compra') {
      this.showModalDetallesCompra = false;
      this.showModalDetalles = true;
    } else if (this.origen === 'pago') {
      this.showModalDetallesCompra = false;
      this.showModalDetallesPago = true;
    }

  }

  // Abrir detalles de compra
  abrirDetallesCompra(origen: string, compra = ''): void {

    this.alertService.loading();

    this.origen = origen;

    this.comprasService.getCompra(compra !== '' ? compra : this.movimientoSeleccionado.compra).subscribe({
      next: ({ compra }) => {
        this.compra = compra;

        this.comprasProductosService.listarProductos({ compra: compra._id }).subscribe({
          next: ({ productos }) => {
            this.productos = productos;

            this.comprasChequesService.listarRelaciones({ compra: compra._id }).subscribe({
              next: ({ relaciones }) => {

                this.relaciones = relaciones;

                // Se obtienen las ordenes de pago
                this.ordenesPagoCompraService.listarRelaciones({ compra: compra._id }).subscribe({
                  next: ({ relaciones }) => {

                    this.ordenesPago = relaciones;
                    this.showModalDetalles = false;
                    this.showModalDetallesCobro = false;
                    this.showModalDetallesPago = false;
                    this.showModalDetallesCompra = true;
                    this.alertService.close();

                  }, error: ({ error }) => this.alertService.errorApi(error.message)
                })

              }, error: ({ error }) => this.alertService.errorApi(error.message)
            })

          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }


  // Abrir detalles de gasto
  abrirDetallesGasto(): void {

    this.alertService.loading();
    this.gastosService.getGasto(this.movimientoSeleccionado.gasto).subscribe({
      next: ({ gasto }) => {
        this.gastoSeleccionado = gasto;
        this.showModalDetallesGasto = true;
        this.showModalDetalles = false;
        this.alertService.close();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })


  }


  // Cerrar detalles de gasto
  cerrarDetallesGasto(): void {
    this.showModalDetallesGasto = false;
    this.showModalDetalles = true;
  }

  // Abrir detalles de cheque
  abrirDetallesCheque(cheque: any, origen: string): void {

    this.chequeSeleccionado = cheque;
    this.origen = origen;

    if (this.origen === 'venta') {

      this.showModalDetallesVenta = false;
      this.showModalDetallesCheque = true;

    } else if (this.origen === 'compra') {

      this.showModalDetallesCompra = false;
      this.showModalDetallesCheque = true;

    } else if (this.origen === 'pago') {

      this.showModalDetallesPago = false;
      this.showModalDetallesCheque = true;

    }


  }

  // Cerrar el detalles del cheque
  cerrarDetallesCheque(): void {

    if (this.origen === 'venta') {

      this.showModalDetallesVenta = true;
      this.showModalDetallesCheque = false;

    } else if (this.origen === 'compra') {

      this.showModalDetallesCompra = true;
      this.showModalDetallesCheque = false;

    } else if (this.origen === 'movimiento') {

      this.showModalDetalles = true;
      this.showModalDetallesCheque = false;

    } else if (this.origen === 'pago') {

      this.showModalDetallesPago = true;
      this.showModalDetallesCheque = false;

    }

  }

  // Abrir detalles de cobro
  abrirDetallesCobro(): void {

    this.totalEnVentas = 0;

    this.alertService.loading();

    // RECIBO DE COBRO
    this.cobrosService.getRecibo(this.movimientoSeleccionado.recibo_cobro).subscribe({
      next: ({ recibo }) => {
        this.recibo_cobro = recibo;

        // RELACION -> RECIBO - VENTAS
        this.recibosCobroVentaService.listarRelaciones({ recibo_cobro: this.recibo_cobro._id }).subscribe({
          next: ({ relaciones }) => {
            this.recibo_ventas = relaciones;
            relaciones.map(relacion => this.totalEnVentas += relacion.monto_cobrado);

            // RELACION -> RECIBO - CHEQUES
            this.recibosCobroChequeService.listarRelaciones({ recibo_cobro: this.recibo_cobro._id }).subscribe({
              next: ({ relaciones }) => {
                this.recibo_cheques = relaciones;
                this.showModalDetalles = false;
                this.showModalDetallesCobro = true;
                this.alertService.close();
              }, error: ({ error }) => this.alertService.errorApi(error.message)
            })

          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  abrirDetallesPago(): void {

    this.totalEnCompras = 0;

    this.alertService.loading();

    // ORDEN DE PAGO
    this.pagosService.getOrdenPago(this.movimientoSeleccionado.orden_pago).subscribe({
      next: ({ orden_pago }) => {

        this.orden_pago = orden_pago;

        // RELACION -> ORDEN PAGO - COMPRAS
        this.ordenesPagoCompraService.listarRelaciones({ orden_pago: this.orden_pago._id }).subscribe({
          next: ({ relaciones }) => {

            this.pago_compras = relaciones;

            relaciones.map(relacion => this.totalEnCompras += relacion.monto_pagado);

            // RELACION -> ORDEN PAGO - CHEQUES
            this.ordenesPagoChequesService.listarRelaciones({ orden_pago: this.orden_pago._id }).subscribe({
              next: ({ relaciones }) => {
                this.pago_cheques = relaciones;
                this.showModalDetalles = false;
                this.showModalDetallesPago = true;
                this.alertService.close();
              }, error: ({ error }) => this.alertService.errorApi(error.message)
            })

          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Abrir detalles de movimiento interno
  abrirDetallesMovimientoInterno(): void {
    this.alertService.loading();
    this.movimientosInternosService.getMovimiento(this.movimientoSeleccionado.movimiento_interno).subscribe({
      next: ({ movimiento }) => {
        this.movimientoInternoSeleccionado = movimiento;
        this.showModalDetalles = false;
        this.showModalDetallesMovimientoInterno = true;
        this.alertService.close();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Cerrar detalles de movimiento interno
  cerrarDetallesMovimientoInterno(): void {
    this.showModalDetalles = true;
    this.showModalDetallesMovimientoInterno = false;
  }

  // Abrir detalles de cheque
  abrirDetallesChequeDesdeMovimiento(): void {
    this.showModalDetalles = false;
    this.alertService.loading();
    this.chequesService.getCheque(this.movimientoSeleccionado.cheque).subscribe({
      next: ({ cheque }) => {
        this.origen = 'movimiento';
        this.chequeSeleccionado = cheque;
        this.showModalDetallesCheque = true;
        this.alertService.close();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
    this.showModalDetallesCheque = true;
  }

  // Cerrar detalles de cobro
  cerrarDetallesCobro(): void {
    this.showModalDetallesCobro = false;
    this.showModalDetalles = true;
  }

  // Cerrar detalles de pago
  cerrarDetallesPago(): void {
    this.showModalDetallesPago = false;
    this.showModalDetalles = true;
  }

  // Abrir reportes - Excel
  abrirReportes(): void {
    this.reportes.fechaDesde = '';
    this.reportes.fechaHasta = '';
    this.showModalReportesMovimientos = true;
  }

  // Reporte - Excel
  reporteExcel(): void {
    this.alertService.question({ msg: 'Generando reporte', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.reportesService.movimientosCajasExcel(this.reportes).subscribe({
            next: (buffer) => {
              const blob = new Blob([buffer.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              saveAs(blob, `Reporte - Movimientos - ${this.caja.descripcion} - ${format(new Date(), 'dd-MM-yyyy')}`);
              this.alertService.close();
              this.showModalReportesMovimientos = false;
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });
  }

  // Filtrar Activo/Inactivo
  filtrarActivos(activo: any): void {
    this.paginaActual = 1;
    this.filtro.activo = activo;
  }

  // Filtrar por Parametro
  filtrarParametro(parametro: string): void {
    this.paginaActual = 1;
    this.filtro.parametro = parametro;
  }

  // Ordenar por columna
  ordenarPorColumna(columna: string) {
    this.ordenar.columna = columna;
    this.ordenar.direccion = this.ordenar.direccion == 1 ? -1 : 1;
    this.alertService.loading();
    this.listarMovimientos();
  }

  // Cambiar cantidad de items
  cambiarCantidadItems(): void {
    this.paginaActual = 1
    this.cambiarPagina(1);
  }

  // Paginacion - Cambiar pagina
  cambiarPagina(nroPagina): void {
    this.paginaActual = nroPagina;
    this.desde = (this.paginaActual - 1) * this.cantidadItems;
    this.alertService.loading();
    this.listarMovimientos();
  }

}
