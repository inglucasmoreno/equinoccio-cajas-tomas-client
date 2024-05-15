import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { TiposGastosService } from 'src/app/services/tipos-gastos.service';

@Component({
  selector: 'app-gastos-tipos',
  templateUrl: './gastos-tipos.component.html',
  styles: [
  ]
})
export class GastosTiposComponent implements OnInit {

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalTipo = false;

  // Estado formulario 
  public estadoFormulario = 'crear';

  // Tipos
  public idTipo: string = '';
  public tipos: any = [];
  public tipoSeleccionado: any;
  public descripcion: string = '';

  // Paginacion
  public paginaActual: number = 1;
  public cantidadItems: number = 10;

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

  constructor(private tiposService: TiposGastosService,
    private authService: AuthService,
    private alertService: AlertService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Tipos de gastos';
    this.permisos.all = this.permisosUsuarioLogin();
    this.alertService.loading();
    this.listarTipos();
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('GASTOS_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Abrir modal
  abrirModal(estado: string, tipo: any = null): void {
    this.reiniciarFormulario();
    this.descripcion = '';
    this.idTipo = '';

    if (estado === 'editar') this.getTipo(tipo);
    else this.showModalTipo = true;

    this.estadoFormulario = estado;
  }

  // Traer datos de tipo
  getTipo(tipo: any): void {
    this.alertService.loading();
    this.idTipo = tipo._id;
    this.tipoSeleccionado = tipo;
    this.tiposService.getTipo(tipo._id).subscribe(({ tipo }) => {
      this.descripcion = tipo.descripcion;
      this.alertService.close();
      this.showModalTipo = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar tipos
  listarTipos(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna
    }
    this.tiposService.listarTipos(parametros)
      .subscribe(({ tipos }) => {
        this.tipos = tipos;
        this.showModalTipo = false;
        this.alertService.close();
      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nuevo tipo
  nuevoTipo(): void {

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

    this.tiposService.nuevoTipo(data).subscribe(() => {
      this.listarTipos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar tipo
  actualizarTipo(): void {

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

    this.tiposService.actualizarTipo(this.idTipo, data).subscribe(() => {
      this.listarTipos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });
  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(tipo: any): void {

    const { _id, activo } = tipo;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.tiposService.actualizarTipo(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarTipos();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
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
    this.listarTipos();
  }

}
