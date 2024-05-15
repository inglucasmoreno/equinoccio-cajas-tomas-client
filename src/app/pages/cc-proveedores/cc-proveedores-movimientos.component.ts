import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { CcProveedoresMovimientosService } from 'src/app/services/cc-proveedores-movimientos.service';
import { CcProveedoresService } from 'src/app/services/cc-proveedores.service';
import { ComprasChequesService } from 'src/app/services/compras-cheques.service';
import { ComprasProductosService } from 'src/app/services/compras-productos.service';
import { ComprasService } from 'src/app/services/compras.service';
import { DataService } from 'src/app/services/data.service';
import { OrdenesPagoChequesService } from 'src/app/services/ordenes-pago-cheques.service';
import { OrdenesPagoCompraService } from 'src/app/services/ordenes-pago-compra.service';
import { OrdenesPagoService } from 'src/app/services/ordenes-pago.service';
import { environment } from 'src/environments/environment';
import { saveAs } from 'file-saver-es'; 
import { format } from 'date-fns';
import { ReportesService } from 'src/app/services/reportes.service';

const base_url = environment.base_url;

@Component({
  selector: 'app-cc-proveedores-movimientos',
  templateUrl: './cc-proveedores-movimientos.component.html',
  styles: [
  ]
})
export class CcProveedoresMovimientosComponent implements OnInit {

  // Fechas
  public reportes = {
    fechaDesde: '',
    fechaHasta: '',
    proveedor: ''
  };

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalMovimiento = false;
  public showModalDetalles = false;
  public showModalDetallesCompra = false;
  public showModalDetallesCheque = false;
  public showModalDetallesPago = false;
  public showModalReportesCC = false;

  // Estado formulario 
  public estadoFormulario = 'crear';

  // Cuenta corriente
  public idCuentaCorriente: string = '';
  public cuentaCorriente: any;

  // Movimiento
  public idMovimiento: string = '';
  public movimientos: any = [];
  public movimientoSeleccionado: any;

  // Compra
  public compra: any;
  public productos: any[];
  public relaciones: any[];  // Relaciones venta_propia = cheques
  public chequeSeleccionado: any;
  public ordenesPago: any[];

  // Pagos
  public orden_pago: any = null;
  public pago_compras: any[] = [];
  public pago_cheques: any[] = [];
  public totalEnCompras: any = 0;

  // Otros
  public origen = 'cobro';

  // Data
  public descripcion: string = '';
  public tipo: string = 'Debe';
  public monto: number = null;

  // Paginacion
  public totalItems: number;
  public paginaActual: number = 1;
  public cantidadItems: number = 10;
  public desde: number = 0;

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
    private movimientosService: CcProveedoresMovimientosService,
    private activatedRoute: ActivatedRoute,
    private comprasService: ComprasService,
    private pagosService: OrdenesPagoService,
    private cuentaCorrienteService: CcProveedoresService,
    private comprasProductosService: ComprasProductosService,
    private ordenesPagoCompraService: OrdenesPagoCompraService,
    private ordenesPagoChequesService: OrdenesPagoChequesService,
    private comprasChequesService: ComprasChequesService,
    public authService: AuthService,
    private reportesService: ReportesService,
    private alertService: AlertService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - CC de proveedores';
    this.activatedRoute.params.subscribe(({ id }) => { this.idCuentaCorriente = id; });
    this.permisos.all = this.permisosUsuarioLogin();
    this.calculosIniciales();
  }

  // Calculos iniciales
  calculosIniciales(): void {
    this.alertService.loading();
    this.cuentaCorrienteService.getCuentaCorriente(this.idCuentaCorriente).subscribe({
      next: ({ cuenta_corriente }) => {
        this.cuentaCorriente = cuenta_corriente;
        this.reportes.proveedor = cuenta_corriente.proveedor._id;
        this.listarMovimientos();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('TESORERIA_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Abrir modal
  abrirModal(estado: string, movimiento: any = null): void {
    window.scrollTo(0, 0);
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
      cc_proveedor: this.idCuentaCorriente,
      parametro: this.filtro.parametro
    }
    this.movimientosService.listarMovimientos(parametros)
      .subscribe(({ movimientos, totalItems }) => {
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
      cc_proveedor: this.cuentaCorriente._id,
      proveedor: this.cuentaCorriente.proveedor._id,
      monto: this.monto,
      tipo: this.tipo,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.movimientosService.nuevoMovimiento(data).subscribe(({ saldo_nuevo }) => {
      this.cuentaCorriente.saldo = saldo_nuevo;
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

    if (movimiento.compra !== '') {
      this.alertService.loading();
      this.comprasService.getCompra(movimiento.compra).subscribe({
        next: ({ compra }) => {
          this.compra = compra;

          this.comprasProductosService.listarProductos({ compra: compra._id }).subscribe({
            next: ({ productos }) => {
              this.productos = productos;

              this.comprasChequesService.listarRelaciones({ compra: compra._id }).subscribe({
                next: ({ relaciones }) => {

                  this.relaciones = relaciones;

                  this.ordenesPagoCompraService.listarRelaciones({ compra: compra._id }).subscribe({

                    next: ({ relaciones }) => {

                      this.ordenesPago = relaciones;
                      this.movimientoSeleccionado = movimiento;
                      this.showModalDetalles = true;
                      this.alertService.close();

                    }, error: ({ error }) => this.alertService.errorApi(error.message)

                  })

                }, error: ({ error }) => this.alertService.errorApi(error.message)
              })

            }, error: ({ error }) => this.alertService.errorApi(error.message)
          })

        }, error: ({ error }) => this.alertService.errorApi(error.message)
      })
    } else {
      this.movimientoSeleccionado = movimiento;
      this.showModalDetalles = true;
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

                this.ordenesPagoCompraService.listarRelaciones({ compra: compra._id }).subscribe({

                  next: ({ relaciones }) => {

                    this.ordenesPago = relaciones;
                    this.showModalDetalles = false;
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

  // Cerrar detalles de venta
  cerrarDetallesCompra(): void {

    if (this.origen === '') {
      this.showModalDetallesCompra = false;
      this.showModalDetalles = true;
    } else if (this.origen === 'pago') {
      this.showModalDetallesCompra = false;
      this.showModalDetallesPago = true;
    }

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


  // Generar PDF
  generarPDF(compra: any): void {
    this.alertService.loading();
    this.comprasService.generarPDF({ compra: compra._id }).subscribe({
      next: () => {
        window.open(`${base_url}/pdf/compra.pdf`, '_blank');
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Abrir detalles de cheque
  abrirDetallesCheque(cheque: any, origen: string): void {

    this.chequeSeleccionado = cheque;
    this.origen = origen;

    if (this.origen === '') {

      this.showModalDetallesCompra = false;
      this.showModalDetallesCheque = true;

    } else if (this.origen === 'pago') {

      this.showModalDetallesPago = false;
      this.showModalDetallesCheque = true;

    }
  }

  // Cerrar el detalles del cheque
  cerrarDetallesCheque(): void {

    if (this.origen === '') {

      this.showModalDetallesCompra = true;
      this.showModalDetallesCheque = false;

    } else if (this.origen === 'pago') {

      this.showModalDetallesPago = true;
      this.showModalDetallesCheque = false;

    }

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
    this.showModalReportesCC = true;
  }

  // Reporte - Excel
  reporteExcel(): void {
    this.alertService.question({ msg: 'Generando reporte', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.reportesService.movimientosProveedoresExcel(this.reportes).subscribe({
            next: (buffer) => {
              const blob = new Blob([buffer.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              saveAs(blob, `Reporte - Movimientos - ${this.cuentaCorriente.proveedor.descripcion.replace(/\./g,"")} - ${format(new Date(), 'dd-MM-yyyy')}`);
              this.alertService.close();
              this.showModalReportesCC = false;
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
