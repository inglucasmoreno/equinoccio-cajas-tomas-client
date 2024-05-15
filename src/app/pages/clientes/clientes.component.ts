import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { ClientesService } from 'src/app/services/clientes.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styles: [
  ]
})
export class ClientesComponent implements OnInit {

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalCliente = false;

  // Estado formulario 
  public estadoFormulario = 'crear';

  // Clientes
  public idCliente: string = '';
  public clientes: any = [];
  public clienteSeleccionado: any;

  public clientesForm: any = {
    descripcion: '',
    tipo_identificacion: 'DNI',
    identificacion: '',
    telefono: '',
    direccion: '',
    correo_electronico: '',
    condicion_iva: 'Consumidor Final'
  }

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
    columna: 'descripcion'
  }

  constructor(private clientesService: ClientesService,
    private authService: AuthService,
    private alertService: AlertService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Clientes';
    this.permisos.all = this.permisosUsuarioLogin();
    this.alertService.loading();
    this.listarClientes();
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('CLIENTES_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Abrir modal
  abrirModal(estado: string, cliente: any = null): void {
    this.reiniciarFormulario();
    this.idCliente = '';

    if (estado === 'editar') this.getCliente(cliente);
    else this.showModalCliente = true;

    this.estadoFormulario = estado;
  }

  // Traer datos de cliente
  getCliente(cliente: any): void {
    this.alertService.loading();
    this.idCliente = cliente._id;
    this.clienteSeleccionado = cliente;
    this.clientesService.getCliente(cliente._id).subscribe(({ cliente }) => {
      this.clientesForm = cliente;
      this.alertService.close();
      this.showModalCliente = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar clientes
  listarClientes(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      desde: this.desde,
      cantidadItems: this.cantidadItems,
      activo: this.filtro.activo,
      parametro: this.filtro.parametro   
    }
    this.clientesService.listarClientes(parametros)
      .subscribe(({ clientes, totalItems }) => {
        this.totalItems = totalItems;
        this.clientes = clientes;
        this.showModalCliente = false;
        this.alertService.close();
      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nuevo cliente
  nuevoCliente(): void {

    const { descripcion, identificacion } = this.clientesForm;

    // Verificacion: Descripción vacia
    if (descripcion.trim() === "") {
      this.alertService.info('Debes colocar una descripción');
      return;
    }

    // Verificacion: Identificacion
    if (identificacion.trim() === "") {
      this.alertService.info('Debes colocar una identificación');
      return;
    }

    this.alertService.loading();

    const data = {
      ...this.clientesForm,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.clientesService.nuevoCliente(data).subscribe(() => {
      this.listarClientes();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar cliente
  actualizarCliente(): void {

    const { descripcion, identificacion } = this.clientesForm;


    // Verificacion: Descripción vacia
    if (descripcion.trim() === "") {
      this.alertService.info('Debes colocar una descripción');
      return;
    }

    // Verificacion: Identificacion
    if (identificacion.trim() === "") {
      this.alertService.info('Debes colocar una identificación');
      return;
    }

    this.alertService.loading();

    const data = {
      ...this.clientesForm,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.clientesService.actualizarCliente(this.idCliente, data).subscribe(() => {
      this.listarClientes();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });
  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(cliente: any): void {

    const { _id, activo } = cliente;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.clientesService.actualizarCliente(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarClientes();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

  // Reiniciando formulario
  reiniciarFormulario(): void {
    this.clientesForm = {
      descripcion: '',
      tipo_identificacion: 'DNI',
      identificacion: '',
      telefono: '',
      direccion: '',
      correo_electronico: '',
      condicion_iva: 'Consumidor Final'
    }
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
    this.listarClientes();
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
    this.listarClientes();
  }

}
