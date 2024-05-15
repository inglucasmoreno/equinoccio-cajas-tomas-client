import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { RecibosCobroChequeService } from 'src/app/services/recibos-cobro-cheque.service';
import { RecibosCobroVentaService } from 'src/app/services/recibos-cobro-venta.service';
import { RecibosCobroService } from 'src/app/services/recibos-cobro.service';
import { ReportesService } from 'src/app/services/reportes.service';
import { VentasPropiasChequesService } from 'src/app/services/ventas-propias-cheques.service';
import { VentasPropiasProductosService } from 'src/app/services/ventas-propias-productos.service';
import { VentasPropiasService } from 'src/app/services/ventas-propias.service';
import { environment } from 'src/environments/environment';
import { saveAs } from 'file-saver-es';
import { format } from 'date-fns';

const base_url = environment.base_url;

@Component({
  selector: 'app-cobros',
  templateUrl: './cobros.component.html',
  styles: [
  ]
})
export class CobrosComponent implements OnInit {

  // Reportes
  public reportes = {
    fechaDesde: '',
    fechaHasta: ''
  }

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalRecibo = false;
  public showModalDetallesCheque = false;
  public showModalDetallesVenta = false;
  public showModalReportesRecibos = false;

  // Estado formulario 
  public estadoFormulario = 'crear';

  // Recibo
  public idRecibo: string = '';
  public recibos: any = [];
  public reciboSeleccionado: any;
  public descripcion: string = '';
  public chequeSeleccionado: any;
  public totalEnVentas: number = 0;

  // Cheques
  public relaciones_cheques: any[] = [];
  public relaciones_ventas: any[] = [];

  // Venta propia
  public ventaPropia: any = null;
  public venta_cheques: any[] = [];
  public productos: any[] = [];

  // Paginacion
  public totalItems: number;
  public paginaActual: number = 1;
  public cantidadItems: number = 10;
  public desde: number = 0;

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
    private recibosService: RecibosCobroService,
    private chequesService: RecibosCobroChequeService,
    private recibosVentasService: RecibosCobroVentaService,
    public authService: AuthService,
    private ventasPropiasService: VentasPropiasService,
    private ventasPropiasChequesService: VentasPropiasChequesService,
    private ventasPropiasProductosService: VentasPropiasProductosService,
    private alertService: AlertService,
    private activatedRoute: ActivatedRoute,
    private reportesService: ReportesService,
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Recibos de cobro';
    this.permisos.all = this.permisosUsuarioLogin();
    this.alertService.loading();
    this.activatedRoute.params.subscribe(({codigo}) => {
      if(codigo) this.filtro.parametro = codigo;
      this.listarRecibos();
    })
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('RECIBOS_COBRO_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Traer datos de recibo de cobro
  getRecibo(recibo: any): void {
    this.alertService.loading();
    this.idRecibo = recibo._id;
    this.reciboSeleccionado = recibo;
    this.recibosService.getRecibo(recibo._id).subscribe(({ recibo }) => {
      this.descripcion = recibo.descripcion;
      this.alertService.close();
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar recibos
  listarRecibos(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      desde: this.desde,
      cantidadItems: this.cantidadItems,
      activo: this.filtro.activo,
      parametro: this.filtro.parametro
    }
    this.recibosService.listarRecibos(parametros)
      .subscribe(({ recibos, totalItems }) => {
        this.recibos = recibos;
        this.totalItems = totalItems;
        this.alertService.close();
      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nuevo recibo
  nuevoRecibo(): void {

    // Verificacion: Descripción vacia
    if (this.descripcion.trim() === "") {
      this.alertService.info('Debes colocar una descripción');
      return;
    }

    this.alertService.loading();

    const data = {
      descripcion: this.descripcion,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.recibosService.nuevoRecibo(data).subscribe(() => {
      this.listarRecibos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar recibo
  actualizarRecibo(): void {

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

    this.recibosService.actualizarRecibo(this.idRecibo, data).subscribe(() => {
      this.listarRecibos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });
  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(recibo: any): void {

    const { _id, activo } = recibo;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.recibosService.actualizarRecibo(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarRecibos();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

  // Abrir detalles de recibo
  abrirDetallesRecibo(recibo: any): void {

    this.totalEnVentas = 0;

    this.alertService.loading();

    // Se obtienen las relaciones RECIBO - CHEQUE
    this.chequesService.listarRelaciones({ recibo_cobro: recibo._id }).subscribe({
      next: ({ relaciones }) => {
        this.relaciones_cheques = relaciones;

        // Se obtienen las relaciones RECIBO - VENTAS
        this.recibosVentasService.listarRelaciones({ recibo_cobro: recibo._id }).subscribe({
          next: ({ relaciones }) => {
            this.relaciones_ventas = relaciones;
            this.reciboSeleccionado = recibo;
            relaciones.map( relacion => this.totalEnVentas += relacion.monto_cobrado );
            this.alertService.close();
            this.showModalRecibo = true;
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  abrirDetallesCheque(cheque: any, origen: any): void {

    this.chequeSeleccionado = cheque;
    this.origen = origen;

    if (origen === 'cobro') {
      this.showModalRecibo = false;
      this.showModalDetallesCheque = true;
    } else if (origen === 'venta') {
      this.showModalDetallesVenta = false;
      this.showModalDetallesCheque = true;
    }

  }

  // Cerrar el detalles del cheque
  cerrarDetallesCheque(): void {

    if (this.origen === 'cobro') {
      this.showModalRecibo = true;
      this.showModalDetallesCheque = false;
    } else if (this.origen === 'venta') {
      this.showModalDetallesVenta = true;
      this.showModalDetallesCheque = false;
    }

  }

  // Abrir detalles de venta
  abrirDetallesVenta(idVenta: string): void {

    this.alertService.loading();

    this.ventasPropiasService.getVenta(idVenta).subscribe({
      next: ({ venta }) => {
        this.ventaPropia = venta;

        this.ventasPropiasProductosService.listarProductos({ venta: venta._id }).subscribe({
          next: ({ productos }) => {
            this.productos = productos;

            this.ventasPropiasChequesService.listarRelaciones({ venta_propia: venta._id }).subscribe({
              next: ({ relaciones }) => {

                this.venta_cheques = relaciones;
                this.showModalRecibo = false;
                this.showModalDetallesVenta = true;
                this.alertService.close();

              }, error: ({ error }) => this.alertService.errorApi(error.message)
            })

          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Cerrar detalles de venta
  cerrarDetallesVenta(): void {
    this.showModalRecibo = true;
    this.showModalDetallesVenta = false;
  }

  // Generar PDF
  generarPDF(recibo: any): void {
    this.alertService.loading();
    this.recibosService.generarPDF({ recibo: recibo._id }).subscribe({
      next: () => {
        window.open(`${base_url}/pdf/recibo_cobro.pdf`, '_blank');
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Abrir reportes - Excel
  abrirReportes(): void {
    this.reportes.fechaDesde = '';
    this.reportes.fechaHasta = '';
    this.showModalReportesRecibos = true;
  }

  // Reporte - Excel
  reporteExcel(): void {
    this.alertService.question({ msg: 'Generando reporte', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.reportesService.recibosCobroExcel({
            fechaDesde: this.reportes.fechaDesde,
            fechaHasta: this.reportes.fechaHasta
          }).subscribe({
            next: (buffer) => {
              const blob = new Blob([buffer.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              saveAs(blob, `Reporte - Recibos de cobro - ${format(new Date(),'dd-MM-yyyy')}`);
              this.alertService.close();
              this.showModalReportesRecibos = false;
            }, error: ({error}) => this.alertService.errorApi(error.message)
          })
        }
      });
  }

  // Reiniciando formulario
  reiniciarFormulario(): void {
    this.descripcion = '';
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
    this.listarRecibos();
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
    this.listarRecibos();
  }

}
