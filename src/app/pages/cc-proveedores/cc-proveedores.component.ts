import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { CcProveedoresService } from 'src/app/services/cc-proveedores.service';
import { DataService } from 'src/app/services/data.service';
import { ProveedoresService } from 'src/app/services/proveedores.service';
import { ReportesService } from 'src/app/services/reportes.service';
import { saveAs } from 'file-saver-es'; 
import { format } from 'date-fns';

@Component({
  selector: 'app-cc-proveedores',
  templateUrl: './cc-proveedores.component.html',
  styles: [
  ]
})
export class CcProveedoresComponent implements OnInit {
  
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

  // Proveedores
  public proveedores: any[] = [];

  // Cuenta corriente
  public idCuentaCorriente: string = '';
  public cuentasCorrientes: any = [];
  public cuentaCorrienteSeleccionada: any;

  // Data
  public proveedor = '';
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
    columna: 'proveedor.descripcion'
  }

  constructor(private ccProveedoresService: CcProveedoresService,
    private proveedoresService: ProveedoresService,
    public authService: AuthService,
    private alertService: AlertService,
    private reportesService: ReportesService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - CC de Proveedores';
    this.permisos.all = this.permisosUsuarioLogin();
    this.alertService.loading();
    this.cargaInicial();
  }

  cargaInicial(): void {

    // Listado de proveedores
    this.alertService.loading();
    this.proveedoresService.listarProveedores().subscribe({
      next: ({ proveedores }) => {
        this.proveedores = proveedores.filter(proveedor => proveedor.activo);
        this.listarCuentasCorrientes();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('CUENTAS_CORRIENTES_PROVEEDORES_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Abrir modal
  abrirModal(estado: string, cuentaCorriente: any = null): void {
    window.scrollTo(0, 0);
    this.reiniciarFormulario();
    this.idCuentaCorriente = '';
    this.proveedor = '';
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
    this.ccProveedoresService.getCuentaCorriente(cuentaCorriente._id).subscribe(({ cuenta_corriente }) => {
      this.proveedor = cuenta_corriente.proveedor._id;
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
    this.ccProveedoresService.listarCuentasCorrientes(parametros)
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
    if (this.proveedor.trim() === "") {
      this.alertService.info('Debes seleccionar un proveedor');
      return;
    }

    // Verificacion: Saldo incorrecto
    if (this.saldo < 0) {
      this.alertService.info('Debes colocar un saldo correcto');
      return;
    }

    this.alertService.loading();

    const data = {
      proveedor: this.proveedor,
      saldo: this.saldo,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.ccProveedoresService.nuevaCuentaCorriente(data).subscribe(() => {
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
          this.ccProveedoresService.actualizarCuentaCorriente(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarCuentasCorrientes();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

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
          this.reportesService.cuentasCorrientesProveedoresExcel(this.reportes).subscribe({
            next: (buffer) => {
              const blob = new Blob([buffer.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              saveAs(blob, `Reporte - CC de proveedores - ${format(new Date(), 'dd-MM-yyyy')}`);
              this.alertService.close();
              this.showModalReportesCC = false;
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });
  }

  // Reiniciando formulario
  reiniciarFormulario(): void {
    this.proveedor = '';
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
