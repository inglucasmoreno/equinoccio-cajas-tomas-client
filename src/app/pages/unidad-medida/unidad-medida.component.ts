import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { UnidadMedidaService } from 'src/app/services/unidad-medida.service';

@Component({
  selector: 'app-unidad-medida',
  templateUrl: './unidad-medida.component.html',
  styles: [
  ]
})
export class UnidadMedidaComponent implements OnInit {

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalUnidad = false;

  // Estado formulario 
  public estadoFormulario = 'crear';

  // Unidad
  public idUnidad: string = '';
  public unidades: any = [];
  public unidadSeleccionada: any;
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

  constructor(private unidadMedidaService: UnidadMedidaService,
              private authService: AuthService,
              private alertService: AlertService,
              private dataService: DataService) { }

    ngOnInit(): void {
      this.dataService.ubicacionActual = 'Dashboard - Unidades de medida'; 
      this.permisos.all = this.permisosUsuarioLogin();
      this.alertService.loading();
      this.listarUnidades(); 
    }

    // Asignar permisos de usuario login
    permisosUsuarioLogin(): boolean {
      return this.authService.usuario.permisos.includes('UNIDAD_MEDIDA_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
    }

    // Abrir modal
    abrirModal(estado: string, unidad: any = null): void {
      this.reiniciarFormulario();
      this.descripcion = '';
      this.idUnidad = '';
      
      if(estado === 'editar') this.getUnidad(unidad);
      else this.showModalUnidad = true;

      this.estadoFormulario = estado;  
    }

    // Traer datos de unidad
    getUnidad(unidad: any): void {
      this.alertService.loading();
      this.idUnidad = unidad._id;
      this.unidadSeleccionada = unidad;
      this.unidadMedidaService.getUnidad(unidad._id).subscribe(({unidad}) => {
        this.descripcion = unidad.descripcion;
        this.alertService.close();
        this.showModalUnidad = true;
      },({error})=>{
        this.alertService.errorApi(error);
      });
    }

    // Listar unidades
    listarUnidades(): void {
      const parametros = {
        direccion: this.ordenar.direccion,
        columna: this.ordenar.columna
      }
      this.unidadMedidaService.listarUnidades(parametros)
      .subscribe( ({ unidades }) => {
        this.unidades = unidades;
        this.showModalUnidad = false;
        this.alertService.close();
      }, (({error}) => {
        this.alertService.errorApi(error.msg);
      }));
    }

    // Nueva unidad
    nuevaUnidad(): void {

      // Verificacion: Descripción vacia
      if(this.descripcion.trim() === ""){
        this.alertService.info('Debes colocar una descripción');
        return;
      }

      this.alertService.loading();

      const data = {
        descripcion: this.descripcion,
        creatorUser: this.authService.usuario.userId,
        updatorUser: this.authService.usuario.userId,
      }

      this.unidadMedidaService.nuevaUnidad(data).subscribe(() => {
        this.listarUnidades();
      },({error})=>{
        this.alertService.errorApi(error.message);  
      });
      
    }

    // Actualizar unidad
    actualizarUnidad(): void {

      // Verificacion: Descripción vacia
      if(this.descripcion.trim() === ""){
        this.alertService.info('Debes colocar una descripción');
        return;
      }

      this.alertService.loading();

      const data = {
        descripcion: this.descripcion,
        updatorUser: this.authService.usuario.userId,
      }

      this.unidadMedidaService.actualizarUnidad(this.idUnidad, data).subscribe(() => {
        this.listarUnidades();
      },({error})=>{
        this.alertService.errorApi(error.message);
      });
    }

    // Actualizar estado Activo/Inactivo
    actualizarEstado(unidad: any): void {
      
      const { _id, activo } = unidad;
      
      if(!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

      this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
          .then(({isConfirmed}) => {  
            if (isConfirmed) {
              this.alertService.loading();
              this.unidadMedidaService.actualizarUnidad(_id, {activo: !activo}).subscribe(() => {
                this.alertService.loading();
                this.listarUnidades();
              }, ({error}) => {
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
    filtrarActivos(activo: any): void{
      this.paginaActual = 1;
      this.filtro.activo = activo;
    }

    // Filtrar por Parametro
    filtrarParametro(parametro: string): void{
      this.paginaActual = 1;
      this.filtro.parametro = parametro;
    }

    // Ordenar por columna
    ordenarPorColumna(columna: string){
      this.ordenar.columna = columna;
      this.ordenar.direccion = this.ordenar.direccion == 1 ? -1 : 1; 
      this.alertService.loading();
      this.listarUnidades();
    }

}
