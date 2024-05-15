import { Component, OnInit } from '@angular/core';
import { add, format } from 'date-fns';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { BancosService } from 'src/app/services/bancos.service';
import { CajasService } from 'src/app/services/cajas.service';
import { ChequesService } from 'src/app/services/cheques.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-cheques',
  templateUrl: './cheques.component.html',
  styles: [
  ]
})
export class ChequesComponent implements OnInit {

  // Permisos de usuarios login
  public permisos = { all: false };

  // Total en cheques activos
  public total: number = 0;

  // Bancos
  public bancos: any[] = [];

  // Modal
  public showModalDetalles = false;
  public showModalCheque = false;
  public showModalCobrandoCheque = false;
  public showModalChequeTransferido = false;
  public showModalChequeCobrado = false;

  // Estado formulario 
  public estadoFormulario = 'crear';

  // Cheque
  public relaciones: any = null;
  public idCheque: string = '';
  public cheques: any = [];
  public chequeSeleccionado: any;
  public destinoTransferencia: any;
  public destinoCobro: any;

  // Date
  public nro_cheque: string = '';
  public importe: number = null;
  public emisor: string = '';
  public banco: string = '';
  public fecha_cobro: string = '';

  // Cajas
  public cajaSeleccionada: string = '';
  public cajas: any[] = [];

  // Paginacion
  public totalItems: number;
  public paginaActual: number = 1;
  public cantidadItems: number = 10;
  public desde: number = 0;

  // Filtrado
  public filtro = {
    estado: 'Creado',
    parametro: ''
  }

  // Ordenar
  public ordenar = {
    direccion: 1,  // Asc (1) | Desc (-1)
    columna: 'fecha_cobro'
  }

  constructor(private chequesService: ChequesService,
    public authService: AuthService,
    private cajasService: CajasService,
    private bancosService: BancosService,
    private alertService: AlertService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Cheques';
    this.permisos.all = this.permisosUsuarioLogin();
    this.alertService.loading();
    this.cargaInicial();
  }

  cargaInicial(): void {
    this.alertService.loading();
    this.bancosService.listarBancos().subscribe({
      next: ({ bancos }) => {
        this.bancos = bancos;
        this.listarCheques();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('TESORERIA_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Abrir modal
  abrirModal(estado: string, cheque: any = null): void {

    this.nro_cheque = '';
    this.importe = null;
    this.emisor = '';
    this.banco = '';
    this.fecha_cobro = '';
    this.idCheque = '';
    this.showModalDetalles = false;

    if (estado === 'editar') this.getCheque(cheque);
    else this.showModalCheque = true;

    this.estadoFormulario = estado;
  }

  // Traer datos de cheque
  getCheque(cheque: any): void {
    this.alertService.loading();
    this.idCheque = cheque._id;
    this.chequeSeleccionado = cheque;
    this.chequesService.getCheque(cheque._id).subscribe(({ cheque }) => {
      this.chequeSeleccionado = cheque;
      this.nro_cheque = cheque.nro_cheque;
      this.importe = cheque.importe;
      this.emisor = cheque.emisor;
      this.banco = cheque.banco._id;
      this.fecha_cobro = format(new Date(cheque.fecha_cobro), 'yyyy-MM-dd');
      this.alertService.close();
      this.showModalCheque = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar cheques
  listarCheques(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      desde: this.desde,
      cantidadItems: this.cantidadItems,
      estado: this.filtro.estado,
      parametro: this.filtro.parametro   
    }
    this.chequesService.listarCheques(parametros)
      .subscribe(({ cheques, totalItems, montoTotal }) => {
        this.total = montoTotal;
        this.cheques = cheques;
        this.totalItems = totalItems;
        this.showModalCheque = false;
        this.showModalCobrandoCheque = false;
        this.alertService.close();
      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nuevo cheque
  nuevoCheque(): void {

    // Verificacion: Numero de cheque vacio
    if (this.nro_cheque.trim() === "") {
      this.alertService.info('Debes colocar un número de cheque');
      return;
    }

    // Verificacion: importe vacio
    if (!this.importe || this.importe < 0) {
      this.alertService.info('Debes colocar un importe válido');
      return;
    }

    // Verificacion: emisor vacio
    if (this.emisor.trim() === '') {
      this.alertService.info('Debes colocar un emisor');
      return;
    }

    // Verificacion: banco vacio
    if (this.banco.trim() === '') {
      this.alertService.info('Debes colocar un banco');
      return;
    }

    // Verificacion: fecha de cobro vacia
    if (this.fecha_cobro.trim() === '') {
      this.alertService.info('Debes colocar una fecha de cobro');
      return;
    }

    this.alertService.loading();

    const data = {
      nro_cheque: this.nro_cheque,
      importe: this.importe,
      banco: this.banco,
      emisor: this.emisor,
      fecha_cobro: this.fecha_cobro,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.chequesService.nuevoCheque(data).subscribe(() => {
      this.listarCheques();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar cheque
  actualizarCheque(): void {

    // Verificacion: Numero de cheque vacio
    if (this.nro_cheque.trim() === "") {
      this.alertService.info('Debes colocar un número de cheque');
      return;
    }

    // Verificacion: importe vacio
    if (!this.importe || this.importe < 0) {
      this.alertService.info('Debes colocar un importe válido');
      return;
    }

    // Verificacion: emisor vacio
    if (this.emisor.trim() === '') {
      this.alertService.info('Debes colocar un emisor');
      return;
    }

    // Verificacion: banco vacio
    if (this.banco.trim() === '') {
      this.alertService.info('Debes colocar un banco');
      return;
    }

    // Verificacion: fecha de cobro vacia
    if (this.fecha_cobro.trim() === '') {
      this.alertService.info('Debes colocar una fecha de cobro');
      return;
    }

    this.alertService.loading();

    const data = {
      nro_cheque: this.nro_cheque,
      importe: this.importe,
      banco: this.banco,
      emisor: this.emisor,
      fecha_cobro: this.fecha_cobro,
      updatorUser: this.authService.usuario.userId,
    }

    this.chequesService.actualizarCheque(this.idCheque, data).subscribe(() => {
      this.listarCheques();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(cheque: any): void {

    const { _id, activo } = cheque;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.chequesService.actualizarCheque(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarCheques();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

  // Eliminar cheque
  eliminarCheque(cheque: any): void {

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: '¿Quieres eliminar este cheque?', buttonText: 'Eliminar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.chequesService.eliminarCheque(cheque._id).subscribe(() => {
            this.alertService.loading();
            this.listarCheques();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

  // Cobrar cheque
  cobrarCheque(): void {

    // Verificacion: Caja destino no seleccionada
    if (this.cajaSeleccionada.trim() === '') {
      this.alertService.info('Debe seleccionar una caja destino');
      return;
    }

    this.alertService.question({ msg: 'Cobrando cheque', buttonText: 'Cobrar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.chequesService.actualizarCheque(this.chequeSeleccionado._id, {
            caja: this.cajaSeleccionada,
            destino_caja: this.cajaSeleccionada,
            estado: 'Cobrado',
            activo: false,
            updatorUser: this.authService.usuario.userId
          }).subscribe({
            next: () => {
              this.listarCheques();
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });

  }

  // Abrir modal cobrando cheque
  abrirModalCobrandoCheque(cheque: any) {
    this.showModalDetalles = false;
    this.alertService.loading();
    this.cajaSeleccionada = '';
    this.chequeSeleccionado = cheque;
    this.cajasService.listarCajas().subscribe({
      next: ({ cajas }) => {
        this.cajas = cajas.filter(caja => caja.activo && caja._id !== '222222222222222222222222');
        this.chequeSeleccionado = cheque;
        this.showModalCobrandoCheque = true;
        this.alertService.close();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Abrir detalles de transferencia
  abrirDetallesTransferencia(cheque: any): void {
    this.chequeSeleccionado = cheque;
    this.showModalDetalles = false;
    this.alertService.loading();
    this.chequesService.getCheque(cheque._id).subscribe({
      next: ({ destino }) => {
        this.destinoTransferencia = destino;
        this.showModalChequeTransferido = true;
        this.alertService.close();
      }, error: ({error}) => this.alertService.errorApi(error.message)
    })
  }

  // Abrir detalles de cobro
  abrirDetallesCobro(cheque: any): void {
    this.chequeSeleccionado = cheque;
    this.showModalDetalles = false;
    this.alertService.loading();
    this.chequesService.getCheque(cheque._id).subscribe({
      next: ({ destino_caja }) => {
        this.destinoCobro = destino_caja;
        this.showModalChequeCobrado = true;
        this.alertService.close();
      }, error: ({error}) => this.alertService.errorApi(error.message)
    })
  }

  // Abrir detalles de cheque
  abrirDetallesCheque(cheque: any): void {
    this.showModalDetalles = true;
    this.chequeSeleccionado = cheque;
    this.alertService.loading();
    this.chequesService.getRelaciones(cheque._id).subscribe({
      next: ({ relaciones }) => {
        this.relaciones = relaciones;
        console.log(relaciones);
        this.alertService.close();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  regresarDetalles(): void {
    this.showModalCheque = false;
    this.showModalChequeCobrado = false;
    this.showModalChequeTransferido = false;
    this.showModalCobrandoCheque = false;
    this.showModalDetalles = true;
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
    this.listarCheques();
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
    this.listarCheques();
  }


}
