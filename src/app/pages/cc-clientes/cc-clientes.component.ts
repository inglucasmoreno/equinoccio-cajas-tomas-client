import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { CcClientesService } from 'src/app/services/cc-clientes.service';
import { ClientesService } from 'src/app/services/clientes.service';
import { DataService } from 'src/app/services/data.service';
import { ReportesService } from 'src/app/services/reportes.service';
import { saveAs } from 'file-saver-es'; 
import { format } from 'date-fns';

@Component({
  selector: 'app-cc-clientes',
  templateUrl: './cc-clientes.component.html',
  styles: [
  ]
})
export class CcClientesComponent implements OnInit {

  // Fechas
  public reportes = { 
    fechaDesde: '', 
    fechaHasta: '',
    activas: 'true'
  };

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalCuentaCorriente = false;
  public showModalReportesCC = false;

  // Estado formulario 
  public estadoFormulario = 'crear';

  // Clientes
  public clientes: any[] = [];

  // Cuenta corriente
  public idCuentaCorriente: string = '';
  public cuentasCorrientes: any = [];
  public cuentaCorrienteSeleccionada: any;

  // Data
  public cliente = '';
  public saldo = null;

  // Paginacion
  public totalItems: number;
  public paginaActual: number = 1;
  public cantidadItems: number = 10;
  public desde: number = 0;

  // Filtrado
  public filtro = {
    activo: 'true',
    parametro: ''
  }

  // Ordenar
  public ordenar = {
    direccion: 1,  // Asc (1) | Desc (-1)
    columna: 'cliente.descripcion'
  }

  constructor(private ccClientesService: CcClientesService,
    private clientesService: ClientesService,
    public authService: AuthService,
    private reportesService: ReportesService,
    private alertService: AlertService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Cuentas corrientes - Clientes';
    this.permisos.all = this.permisosUsuarioLogin();
    this.alertService.loading();
    this.cargaInicial();
  }

  cargaInicial(): void {

    // Listado de clientes
    this.alertService.loading();
    this.clientesService.listarClientes().subscribe({
      next: ({ clientes }) => {
        this.clientes = clientes.filter(cliente => cliente.activo);
        this.listarCuentasCorrientes();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('CUENTAS_CORRIENTES_CLIENTES_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Abrir modal
  abrirModal(estado: string, cuentaCorriente: any = null): void {
    this.reiniciarFormulario();
    this.idCuentaCorriente = '';
    this.cliente = '';
    this.saldo = null;

    if (estado === 'editar') this.getCuentaCorriente(cuentaCorriente);
    else this.showModalCuentaCorriente = true;
    this.estadoFormulario = estado;
  }

  // Traer datos de cuenta corriente
  getCuentaCorriente(cuentaCorriente: any): void {
    this.alertService.loading();
    this.idCuentaCorriente = cuentaCorriente._id;
    this.cuentaCorrienteSeleccionada = cuentaCorriente;
    this.ccClientesService.getCuentaCorriente(cuentaCorriente._id).subscribe(({ cuenta_corriente }) => {
      this.cliente = cuenta_corriente.cliente._id;
      this.saldo = cuenta_corriente.saldo;
      this.alertService.close();
      this.showModalCuentaCorriente = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar cuentas corrientes
  listarCuentasCorrientes(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      desde: this.desde,
      cantidadItems: this.cantidadItems,
      activo: this.filtro.activo,
      parametro: this.filtro.parametro
    }
    this.ccClientesService.listarCuentasCorrientes(parametros)
      .subscribe(({ cuentas_corrientes, totalItems }) => {
        this.cuentasCorrientes = cuentas_corrientes;
        this.totalItems = totalItems;
        this.showModalCuentaCorriente = false;
        this.alertService.close();
      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nueva cuenta corriente
  nuevaCuentaCorriente(): void {

    // Verificacion: Descripción vacia
    if (this.cliente.trim() === "") {
      this.alertService.info('Debes seleccionar un cliente');
      return;
    }

    this.alertService.loading();

    const data = {
      cliente: this.cliente,
      saldo: this.saldo,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.ccClientesService.nuevaCuentaCorriente(data).subscribe(() => {
      this.listarCuentasCorrientes();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(cuenta_corriente: any): void {

    const { _id, activo } = cuenta_corriente;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.ccClientesService.actualizarCuentaCorriente(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarCuentasCorrientes();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

  // Abrir reportes - Excel
  abrirReportes(): void {
    this.reportes.fechaDesde = '';
    this.reportes.fechaHasta = '';
    this.reportes.activas = 'true';
    this.showModalReportesCC = true;
  }

  // Reporte - Excel
  reporteExcel(): void {
    this.alertService.question({ msg: 'Generando reporte', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.reportesService.cuentasCorrientesClientesExcel(this.reportes).subscribe({
            next: (buffer) => {
              const blob = new Blob([buffer.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              saveAs(blob, `Reporte - CC de clientes - ${format(new Date(), 'dd-MM-yyyy')}`);
              this.alertService.close();
              this.showModalReportesCC = false;
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });
  }

  // Reiniciando formulario
  reiniciarFormulario(): void {
    this.cliente = '';
    this.saldo = null;
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
    this.listarCuentasCorrientes();
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
    this.listarCuentasCorrientes();
  }

}
