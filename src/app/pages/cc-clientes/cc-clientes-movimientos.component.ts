import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { CcClientesMovimientosService } from 'src/app/services/cc-clientes-movimientos.service';
import { CcClientesService } from 'src/app/services/cc-clientes.service';
import { DataService } from 'src/app/services/data.service';
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
  selector: 'app-cc-clientes-movimientos',
  templateUrl: './cc-clientes-movimientos.component.html',
})
export class CcClientesMovimientosComponent implements OnInit {

  // Fechas
  public reportes = { 
    fechaDesde: '', 
    fechaHasta: '',
    cliente: ''
  };

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalMovimiento = false;
  public showModalDetalles = false;
  public showModalDetallesVenta = false;
  public showModalDetallesCheque = false;
  public showModalDetallesCobro = false;
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

  // Data
  public descripcion: string = '';
  public tipo: string = 'Debe';
  public monto: number = null;

  // Paginacion
  public totalItems: number;
  public paginaActual: number = 1;
  public cantidadItems: number = 10;
  public desde: number = 0;

  // Venta propia
  public ventaPropia: any;
  public productos: any[];
  public relaciones: any[];  // Relaciones venta_propia = cheques
  public chequeSeleccionado: any;
  public recibosCobro: any[];

  // Cobros
  public recibo_cobro: any = null;
  public recibo_ventas: any[] = [];
  public recibo_cheques: any[] = [];
  public totalEnVentas: number = 0;

  // Otros
  public origen = 'cobro';

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
    private movimientosService: CcClientesMovimientosService,
    private activatedRoute: ActivatedRoute,
    private cobrosService: RecibosCobroService,
    private recibosCobroVentaService: RecibosCobroVentaService,
    private recibosCobroChequeService: RecibosCobroChequeService,
    private cuentaCorrienteService: CcClientesService,
    private ventasPropiasService: VentasPropiasService,
    private ventasPropiasChequesService: VentasPropiasChequesService,
    private ventasPropiasProductosService: VentasPropiasProductosService,
    public authService: AuthService,
    private alertService: AlertService,
    private reportesService: ReportesService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - CC de clientes';
    this.activatedRoute.params.subscribe(({ id }) => { 
      this.idCuentaCorriente = id;
      this.permisos.all = this.permisosUsuarioLogin();
      this.calculosIniciales();
    });
  }

  // Calculos iniciales
  calculosIniciales(): void {
    this.alertService.loading();
    this.cuentaCorrienteService.getCuentaCorriente(this.idCuentaCorriente).subscribe({
      next: ({ cuenta_corriente }) => {
        this.cuentaCorriente = cuenta_corriente;
        this.reportes.cliente = cuenta_corriente.cliente._id;
        this.listarMovimientos();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('VENTAS_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
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
      activo: this.filtro.activo,
      parametro: this.filtro.parametro, 
      cc_cliente: this.idCuentaCorriente
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
      cc_cliente: this.cuentaCorriente._id,
      cliente: this.cuentaCorriente.cliente._id,
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
    if (movimiento.venta_propia !== '') {
      this.alertService.loading();
      this.ventasPropiasService.getVenta(movimiento.venta_propia).subscribe({
        next: ({ venta }) => {
          this.ventaPropia = venta;

          this.ventasPropiasProductosService.listarProductos({ venta: venta._id }).subscribe({
            next: ({ productos }) => {
              this.productos = productos;

              this.ventasPropiasChequesService.listarRelaciones({ venta_propia: venta._id }).subscribe({
                next: ({ relaciones }) => {

                  this.relaciones = relaciones;

                  this.movimientoSeleccionado = movimiento;
                  this.showModalDetalles = true;

                  this.alertService.close();

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

                  }, error: ({error}) => this.alertService.errorApi(error.message)
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

    if (this.origen === '') {
      this.showModalDetallesVenta = false;
      this.showModalDetalles = true;
    } else if (this.origen === 'cobro') {
      this.showModalDetallesVenta = false;
      this.showModalDetallesCobro = true;
    }

  }

  // Abrir detalles de cheque
  abrirDetallesCheque(cheque: any, origen: string): void {

    this.chequeSeleccionado = cheque;
    this.origen = origen;

    if (this.origen === '') {

      this.showModalDetallesVenta = false;
      this.showModalDetallesCheque = true;

    } else if (this.origen === 'cobro') {

      this.showModalDetallesCobro = false;
      this.showModalDetallesCheque = true;

    }
  }

  // Cerrar el detalles del cheque
  cerrarDetallesCheque(): void {

    if (this.origen === '') {

      this.showModalDetallesVenta = true;
      this.showModalDetallesCheque = false;

    } else if (this.origen === 'cobro') {

      this.showModalDetallesCobro = true;
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
            relaciones.map( relacion => this.totalEnVentas += relacion.monto_cobrado );

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
          this.reportesService.movimientosClientesExcel(this.reportes).subscribe({
            next: (buffer) => {
              const blob = new Blob([buffer.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              saveAs(blob, `Reporte - Movimientos - ${this.cuentaCorriente.cliente.descripcion.replace(/\./g,"")} - ${format(new Date(), 'dd-MM-yyyy')}`);
              this.alertService.close();
              this.showModalReportesCC = false;
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });
  }

  // Cerrar detalles de cobro
  cerrarDetallesCobro(): void {
    this.showModalDetallesCobro = false;
    this.showModalDetalles = true;
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
