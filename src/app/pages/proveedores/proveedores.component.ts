import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { ProveedoresService } from 'src/app/services/proveedores.service';

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.component.html',
  styles: [
  ]
})
export class ProveedoresComponent implements OnInit {

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalProveedor = false;

  // Estado formulario 
  public estadoFormulario = 'crear';

  // Proveedores
  public idProveedor: string = '';
  public proveedores: any = [];
  public proveedorSeleccionado: any;

  public proveedoresForm: any = {
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

  constructor(private proveedoresService: ProveedoresService,
    private authService: AuthService,
    private alertService: AlertService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Proveedores';
    this.permisos.all = this.permisosUsuarioLogin();
    this.alertService.loading();
    this.listarProveedores();
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('PROVEEDORES_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Abrir modal
  abrirModal(estado: string, proveedor: any = null): void {
    this.reiniciarFormulario();
    this.idProveedor = '';

    if (estado === 'editar') this.getProveedor(proveedor);
    else this.showModalProveedor = true;

    this.estadoFormulario = estado;
  }

  // Traer datos de proveedor
  getProveedor(proveedor: any): void {
    this.alertService.loading();
    this.idProveedor = proveedor._id;
    this.proveedorSeleccionado = proveedor;
    this.proveedoresService.getProveedor(proveedor._id).subscribe(({ proveedor }) => {
      this.proveedoresForm = proveedor;
      this.alertService.close();
      this.showModalProveedor = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar proveedores
  listarProveedores(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      desde: this.desde,
      cantidadItems: this.cantidadItems,
      activo: this.filtro.activo,
      parametro: this.filtro.parametro   
    }
    this.proveedoresService.listarProveedores(parametros)
      .subscribe(({ proveedores, totalItems }) => {
        this.proveedores = proveedores;
        this.totalItems = totalItems;
        this.showModalProveedor = false;
        this.alertService.close();
      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nuevo proveedor
  nuevoProveedor(): void {

    const { descripcion } = this.proveedoresForm;

    // Verificacion: Descripción vacia
    if (descripcion.trim() === "") {
      this.alertService.info('Debes colocar una descripción');
      return;
    }

    this.alertService.loading();

    const data = {
      ...this.proveedoresForm,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.proveedoresService.nuevoProveedor(data).subscribe(() => {
      this.listarProveedores();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar proveedor
  actualizarProveedor(): void {

    const { descripcion, identificacion } = this.proveedoresForm;


    // Verificacion: Descripción vacia
    if (descripcion.trim() === "") {
      this.alertService.info('Debes colocar una descripción');
      return;
    }

    this.alertService.loading();

    const data = {
      ...this.proveedoresForm,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.proveedoresService.actualizarProveedor(this.idProveedor, data).subscribe(() => {
      this.listarProveedores();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });
  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(proveedor: any): void {

    const { _id, activo } = proveedor;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.proveedoresService.actualizarProveedor(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarProveedores();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

  // Reiniciando formulario
  reiniciarFormulario(): void {
    this.proveedoresForm = {
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
    this.listarProveedores();
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
    this.listarProveedores();
  }  

}
