import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { CajasService } from 'src/app/services/cajas.service';
import { DataService } from 'src/app/services/data.service';
import { InicializacionService } from 'src/app/services/inicializacion.service';
import { ReportesService } from 'src/app/services/reportes.service';
import { saveAs } from 'file-saver-es';
import { format } from 'date-fns';

@Component({
  selector: 'app-cajas',
  templateUrl: './cajas.component.html',
  styles: [
  ]
})
export class CajasComponent implements OnInit {

  // Fechas
  public reportes = {
    fechaDesde: '',
    fechaHasta: '',
    activas: 'true'
  };

  // Flags
  public flagInicializacion = false;
  public flagMovimientoInterno = false;
  public showModalReportesCajas = false;

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalCaja = false;
  public showModalMovimientoInterno = false;

  // Estado formulario
  public estadoFormulario = 'crear';

  // Caja
  public idCaja: string = '';
  public cajas: any = [];
  public cajasSelectorOrigen: any = [];
  public cajasSelectorDestino: any = [];
  public monto: number = null;
  public cajaSeleccionada: any;
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

  constructor(private cajasService: CajasService,
    private inicializacionService: InicializacionService,
    public authService: AuthService,
    private alertService: AlertService,
    private reportesService: ReportesService,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Cajas';
    this.permisos.all = this.permisosUsuarioLogin();
    this.alertService.loading();
    this.listarCajas();
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('CAJAS_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Abrir modal
  abrirModal(estado: string, caja: any = null): void {
    this.reiniciarFormulario();
    this.descripcion = '';
    this.monto = null;
    this.idCaja = '';

    if (estado === 'editar') this.getCaja(caja);
    else this.showModalCaja = true;

    this.estadoFormulario = estado;
  }

  // Traer datos de caja
  getCaja(caja: any): void {
    this.alertService.loading();
    this.idCaja = caja._id;
    this.cajaSeleccionada = caja;
    this.cajasService.getCaja(caja._id).subscribe(({ caja }) => {
      this.descripcion = caja.descripcion;
      this.monto = caja.saldo;
      this.alertService.close();
      this.showModalCaja = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar cajas
  listarCajas(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna
    }
    this.cajasService.listarCajas(parametros)
      .subscribe(({ cajas }) => {
        if (this.authService.usuario.role !== 'ADMIN_ROLE')
          this.cajas = cajas.filter(caja => this.authService.usuario.permisos_cajas.includes(caja._id));
        else this.cajas = cajas;
        const cajasSelector = cajas.filter(caja => caja.activo && caja._id !== '222222222222222222222222');
        this.cajasSelectorOrigen = this.authService.usuario.role === 'ADMIN_ROLE' ? cajasSelector : this.cajas.filter(caja => caja.activo && caja._id !== '222222222222222222222222');
        this.cajasSelectorDestino = cajasSelector;
        this.showModalCaja = false;

        // FLAG - INICIALIZACION
        if (this.flagInicializacion) {
          this.flagInicializacion = false;
          this.alertService.success('Inicializacion completada');
        } else {
          this.alertService.close();
        }

        // FLAG - MOVIMIENTO INTERNO
        if (this.flagMovimientoInterno) {
          this.flagMovimientoInterno = false;
          this.alertService.success('Movimiento interno generado corretamente');
        } else {
          this.alertService.close();
        }

        this.showModalMovimientoInterno = false;

      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nueva caja
  nuevaCaja(): void {

    // Verificacion: Descripción vacia
    if (this.descripcion.trim() === "") {
      this.alertService.info('Debes colocar una descripción');
      return;
    }

    // Verificacion: Monto inicial vacia
    // if (this.monto < 0) {
    //   this.alertService.info('Debes colocar un monto válido');
    //   return;
    // }

    // Generar movimiento interno
    this.alertService.question({ msg: 'Estas por crear una caja', buttonText: 'Crear' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();

          const data = {
            descripcion: this.descripcion,
            saldo: this.dataService.redondear(this.monto, 2),
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId,
          }

          this.cajasService.nuevaCaja(data).subscribe(() => {
            this.listarCajas();
          }, ({ error }) => {
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

  // Actualizar caja
  actualizarCaja(): void {

    // Verificacion: Descripción vacia
    if (this.descripcion.trim() === "") {
      this.alertService.info('Debes colocar una descripción');
      return;
    }

    // Verificacion: Monto inicial vacia
    // if (this.monto < 0) {
    //   this.alertService.info('Debes colocar un monto válido');
    //   return;
    // }

    this.alertService.loading();

    const data = {
      descripcion: this.descripcion,
      saldo: this.monto,
      updatorUser: this.authService.usuario.userId,
    }

    this.cajasService.actualizarCaja(this.idCaja, data).subscribe(() => {
      this.listarCajas();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });
  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(caja: any): void {

    const { _id, activo } = caja;

    if (!this.permisos.all || this.authService.usuario.role !== 'ADMIN_ROLE') return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    // if (caja._id === '000000000000000000000000' || caja._id === '111111111111111111111111' || caja._id === '222222222222222222222222' || caja._id === '333333333333333333333333') {
    //   this.alertService.info('No se puede dar de baja a esta caja');
    //   return;
    // }

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.cajasService.actualizarCaja(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarCajas();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

  // Inicializar cajas
  inicializarCajas(): void {
    this.alertService.question({ msg: '¿Quieres inicializar las cajas?', buttonText: 'Inicializar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.inicializacionService.inicializarCajas(this.authService.usuario.userId).subscribe({
            next: () => {
              this.flagInicializacion = true;
              this.listarCajas();
            },
            error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });
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

    // Verificacion: Saldo de caja inicial insuficiente
    let saldoCajaInicial = 0;

    this.cajas.map(elemento => {
      if (String(elemento._id) === String(this.movimientoInterno.caja_origen)) saldoCajaInicial = elemento.saldo;
    });

    if (this.movimientoInterno.monto_origen > saldoCajaInicial) {
      this.alertService.info('Saldo de caja origen insuficiente');
      return;
    }

    this.alertService.question({ msg: 'Generando movimiento', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.cajasService.movimientoInterno(this.movimientoInterno).subscribe({
            next: () => {
              this.flagMovimientoInterno = true;
              this.listarCajas();
              this.authService.getCaja();
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });
  }

  // Abrir movimiento interno
  abrirMovimientoInterno(): void {
    this.movimientoInterno = {
      caja_origen: '',
      caja_destino: '',
      observacion: '',
      monto_origen: null,
      monto_destino: null,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }
    this.showModalMovimientoInterno = true;
  }

  // Duplicar monto
  duplicarMonto(): void {
    this.movimientoInterno.monto_destino = this.movimientoInterno.monto_origen;
  }

  // Reiniciando formulario
  reiniciarFormulario(): void {
    this.descripcion = '';
  }

  // Abrir reportes - Excel
  abrirReportes(): void {
    this.reportes.fechaDesde = '';
    this.reportes.fechaHasta = '';
    this.reportes.activas = 'true';
    this.showModalReportesCajas = true;
  }

  // Reporte - Excel
  reporteExcel(): void {
    this.alertService.question({ msg: 'Generando reporte', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.reportesService.cajasExcel(this.reportes).subscribe({
            next: (buffer) => {
              const blob = new Blob([buffer.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              saveAs(blob, `Reporte - Cajas - ${format(new Date(), 'dd-MM-yyyy')}`);
              this.alertService.close();
              this.showModalReportesCajas = false;
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });
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
    this.listarCajas();
  }


}
