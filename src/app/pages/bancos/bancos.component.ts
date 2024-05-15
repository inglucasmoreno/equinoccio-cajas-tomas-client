import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { BancosService } from 'src/app/services/bancos.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-bancos',
  templateUrl: './bancos.component.html',
  styles: [
  ]
})
export class BancosComponent implements OnInit {

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalBanco = false;

  // Estado formulario 
  public estadoFormulario = 'crear';

  // Banco
  public idBanco: string = '';
  public bancos: any = [];
  public bancoSeleccionado: any;
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

  constructor(private bancosService: BancosService,
    private authService: AuthService,
    private alertService: AlertService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Bancos';
    this.permisos.all = this.permisosUsuarioLogin();
    this.alertService.loading();
    this.listarBancos();
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('BANCOS_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Abrir modal
  abrirModal(estado: string, banco: any = null): void {
    window.scrollTo(0, 0);
    this.reiniciarFormulario();
    this.descripcion = '';
    this.idBanco = '';

    if (estado === 'editar') this.getBanco(banco);
    else this.showModalBanco = true;

    this.estadoFormulario = estado;
  }

  // Traer datos de banco
  getBanco(banco: any): void {
    this.alertService.loading();
    this.idBanco = banco._id;
    this.bancoSeleccionado = banco;
    this.bancosService.getBanco(banco._id).subscribe(({ banco }) => {
      this.descripcion = banco.descripcion;
      this.alertService.close();
      this.showModalBanco = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar bancos
  listarBancos(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna
    }
    this.bancosService.listarBancos(parametros)
      .subscribe(({ bancos }) => {
        this.bancos = bancos;
        this.showModalBanco = false;
        this.alertService.close();
      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nuevo banco
  nuevoBanco(): void {

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

    this.bancosService.nuevoBanco(data).subscribe(() => {
      this.listarBancos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar banco
  actualizarBanco(): void {

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

    this.bancosService.actualizarBanco(this.idBanco, data).subscribe(() => {
      this.listarBancos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });
  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(banco: any): void {

    const { _id, activo } = banco;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.bancosService.actualizarBanco(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarBancos();
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
    this.listarBancos();
  }

}
