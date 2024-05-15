import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { CajasService } from 'src/app/services/cajas.service';
import { DataService } from 'src/app/services/data.service';
import { MovimientosInternosService } from 'src/app/services/movimientos-internos.service';

@Component({
  selector: 'app-movimientos-internos',
  templateUrl: './movimientos-internos.component.html',
  styles: [
  ]
})
export class MovimientosInternosComponent implements OnInit {

  // Flags
  public textoCompleto: boolean = false;

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalMovimiento = false;
  public showModalDetalles = false;
  public showModalMovimientoInterno = false;

  // Estado formulario
  public estadoFormulario = 'crear';

  // Caja
  public cajas: any[] = [];
  public caja: any;
  public cajasSelectorOrigen: any[] = [];
  public cajasSelectorDestino: any[] = [];

  // Movimiento
  public idMovimiento: string = '';
  public movimientos: any = [];
  public movimientoSeleccionado: any;
  public descripcion: string = '';

  // Movimiento interno
  public movimientoInterno = {
    caja_origen: '',
    caja_destino: '',
    observacion: '',
    monto_origen: null,
    monto_destino: null,
    creatorUser: this.authService.usuario.userId,
    updatorUser: this.authService.usuario.userId,
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
    direccion: -1,  // Asc (1) | Desc (-1)
    columna: 'createdAt'
  }

  constructor(
    private movimientosInternosService: MovimientosInternosService,
    public authService: AuthService,
    private cajasService: CajasService,
    private alertService: AlertService,
    private dataService: DataService
  ) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Movimientos internos';
    this.alertService.loading();
    this.permisos.all = this.permisosUsuarioLogin();
    this.calculosIniciales();
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('MOVIMIENTOS_INTERNOS_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Calculos iniciales
  calculosIniciales(): void {
    this.alertService.loading();
    this.cajasService.listarCajas().subscribe({
      next: ({ cajas }) => {
        this.cajas = cajas.filter(caja => caja.activo && caja._id.toString() !== '222222222222222222222222');
        if (this.authService.usuario.role === 'ADMIN_ROLE') this.cajasSelectorOrigen = this.cajas;
        else this.cajasSelectorOrigen = this.cajas.filter(caja => this.authService.usuario.permisos_cajas.includes(caja._id.toString()));
        this.cajasSelectorDestino = this.cajas;
        this.listarMovimientos();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Abrir modal
  abrirModal(estado: string, movimiento: any = null): void {
    window.scrollTo(0, 0);
    this.reiniciarFormulario();
    this.descripcion = '';
    this.idMovimiento = '';

    if (estado === 'editar') this.getMovimiento(movimiento);
    else this.showModalMovimiento = true;

    this.estadoFormulario = estado;
  }

  // Traer datos de movimiento
  getMovimiento(movimiento: any): void {
    this.alertService.loading();
    this.idMovimiento = movimiento._id;
    this.movimientoSeleccionado = movimiento;
    this.movimientosInternosService.getMovimiento(movimiento._id).subscribe(({ movimiento }) => {
      this.descripcion = movimiento.descripcion;
      this.alertService.close();
      this.showModalMovimiento = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar movimientos
  listarMovimientos(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      desde: this.desde,
      usuario: this.authService.usuario.userId,
      cantidadItems: this.cantidadItems,
      parametro: this.filtro.parametro,
      activo: this.filtro.activo
    }
    this.movimientosInternosService.listarMovimientos(parametros)
      .subscribe(({ movimientos, totalItems }) => {
        this.totalItems = totalItems;
        this.movimientos = movimientos;
        this.showModalMovimiento = false;
        this.showModalMovimientoInterno = false;
        this.alertService.close();
      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nuevo movimiento
  nuevoMovimiento(): void {

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

    this.movimientosInternosService.nuevoMovimiento(data).subscribe(() => {
      this.listarMovimientos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar movimiento
  actualizarMovimiento(): void {

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

    this.movimientosInternosService.actualizarMovimiento(this.idMovimiento, data).subscribe(() => {
      this.listarMovimientos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });
  }

  // Abrir movimiento interno
  abrirMovimientoInterno(): void {
    this.movimientoInterno = {
      caja_origen: this.authService.caja ? this.authService.caja._id : '',
      caja_destino: '',
      observacion: '',
      monto_origen: null,
      monto_destino: null,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }
    this.showModalMovimientoInterno = true;
  }

  // Movimiento interno
  generarMovimientoInterno(): void {

    // Verificacion: Caja origen
    if (this.movimientoInterno.caja_origen === '') {
      this.alertService.info('Debe seleccionar una caja origen');
      return;
    }

    // Verificacion: Caja destino
    if (this.movimientoInterno.caja_destino === '') {
      this.alertService.info('Debe seleccionar una caja destino');
      return;
    }

    // Verificacion: Monto origen
    if (this.movimientoInterno.monto_origen < 0) {
      this.alertService.info('Debe colocar un monto de origen correcto');
      return;
    }

    // Verificacion: Monto destino
    if (this.movimientoInterno.monto_destino < 0) {
      this.alertService.info('Debe colocar un monto de destino correcto');
      return;
    }

    // Verificacion: Origen === Destino
    if (this.movimientoInterno.caja_origen === this.movimientoInterno.caja_destino) {
      this.alertService.info('El origen y el destino deben ser diferentes');
      return;
    }

    // Verificacion: Saldo origen
    if (this.movimientoInterno.monto_origen <= 0) {
      this.alertService.info('Debe colocar un saldo de origen correcto');
      return;
    }

    // Verificacion: Saldo destino
    if (this.movimientoInterno.monto_destino <= 0) {
      this.alertService.info('Debe colocar un saldo de destino correcto');
      return;
    }

    // Verificacion: Saldo de caja inicial insuficiente
    let saldoCajaInicial = 0;

    this.cajas.map(elemento => {
      if (String(elemento._id) === String(this.movimientoInterno.caja_origen)) saldoCajaInicial = elemento.saldo;
    });

    // if (this.movimientoInterno.monto_origen > saldoCajaInicial) {
    //   this.alertService.info('Saldo de caja origen insuficiente');
    //   return;
    // }

    // Verificacion: Debe colocar una observacion
    if (this.movimientoInterno.observacion.trim() === '') {
      this.alertService.info('Debe colocar una observación');
      return;
    }

    this.alertService.question({ msg: 'Generando movimiento', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.cajasService.getCaja(this.movimientoInterno.caja_origen).subscribe({
            next: ({ caja }) => {
              if (caja.saldo < this.movimientoInterno.monto_origen) {
                this.alertService.question({ msg: 'La caja origen no tiene suficiente dinero', buttonText: 'Continuar' })
                  .then(({ isConfirmed }) => {
                    if (isConfirmed) {
                      this.alertService.loading();
                      this.cajasService.movimientoInterno(this.movimientoInterno).subscribe({
                        next: () => {
                          this.listarMovimientos();
                          this.authService.getCaja();
                        }, error: ({ error }) => this.alertService.errorApi(error.message)
                      })
                    }
                  });
              } else {
                this.alertService.loading();
                this.cajasService.movimientoInterno(this.movimientoInterno).subscribe({
                  next: () => {
                    this.listarMovimientos();
                    this.authService.getCaja();
                  }, error: ({ error }) => this.alertService.errorApi(error.message)
                })
              }
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          });
        }
      });
  }


  // Actualizar estado Activo/Inactivo
  actualizarEstado(movimiento: any): void {

    const { _id, activo } = movimiento;

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.movimientosInternosService.actualizarMovimiento(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarMovimientos();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

  // Duplicar monto
  duplicarMonto(): void {
    this.movimientoInterno.monto_destino = this.movimientoInterno.monto_origen;
  }

  // Alta/Baja - Movimiento
  altaBajaMovimiento(movimiento: any): void {

    const data = {
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    };

    this.alertService.question({
      msg: movimiento.activo ? 'Baja de movimiento' : 'Alta de movimiento',
      buttonText: movimiento.activo ? 'Baja' : 'Alta'
    })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.movimientosInternosService.altaBajaMovimiento(movimiento._id, data).subscribe({
            next: () => {
              this.authService.getCaja();
              this.cambiarPagina(1);
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          });
        }
      });
  }

  // Abrir detalle de movimiento interno
  abrirDetalles(movimiento: any): void {
    this.movimientoSeleccionado = movimiento;
    this.showModalDetalles = true;
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
    this.listarMovimientos();
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
    this.listarMovimientos();
  }

}
