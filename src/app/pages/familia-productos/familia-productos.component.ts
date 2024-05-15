import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { FamiliaProductosService } from 'src/app/services/familia-productos.service';

@Component({
  selector: 'app-familia-productos',
  templateUrl: './familia-productos.component.html',
  styles: [
  ]
})
export class FamiliaProductosComponent implements OnInit {

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalFamilia = false;

  // Estado formulario 
  public estadoFormulario = 'crear';

  // Familias
  public idFamilia: string = '';
  public familias: any = [];
  public familiaSeleccionada: any;
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

  constructor(private familiaProductosService: FamiliaProductosService,
    private authService: AuthService,
    private alertService: AlertService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Familias de productos';
    this.permisos.all = this.permisosUsuarioLogin();
    this.alertService.loading();
    this.listarFamilias();
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('FAMILIA_PRODUCTOS_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Abrir modal
  abrirModal(estado: string, familia: any = null): void {
    this.reiniciarFormulario();
    this.descripcion = '';
    this.idFamilia = '';

    if (estado === 'editar') this.getFamilia(familia);
    else this.showModalFamilia = true;

    this.estadoFormulario = estado;
  }

  // Traer datos de familia
  getFamilia(familia: any): void {
    this.alertService.loading();
    this.idFamilia = familia._id;
    this.familiaSeleccionada = familia;
    this.familiaProductosService.getFamilia(familia._id).subscribe(({ familia }) => {
      this.descripcion = familia.descripcion;
      this.alertService.close();
      this.showModalFamilia = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar familias
  listarFamilias(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna
    }
    this.familiaProductosService.listarFamilias(parametros)
      .subscribe(({ familias }) => {
        this.familias = familias;
        this.showModalFamilia = false;
        this.alertService.close();
      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nueva familia
  nuevaFamilia(): void {

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

    this.familiaProductosService.nuevaFamilia(data).subscribe(() => {
      this.listarFamilias();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar familia
  actualizarFamilia(): void {

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

    this.familiaProductosService.actualizarFamilia(this.idFamilia, data).subscribe(() => {
      this.listarFamilias();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });
  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(familia: any): void {

    const { _id, activo } = familia;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.familiaProductosService.actualizarFamilia(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarFamilias();
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
    this.listarFamilias();
  }

}
