import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { MovimientosService } from 'src/app/services/movimientos.service';
import gsap from 'gsap';

@Component({
  selector: 'app-movimientos',
  templateUrl: './movimientos.component.html',
  styles: [
  ]
})
export class MovimientosComponent implements OnInit {

  // Modals
  showModalCreacion = false;
  showModalDetalles = false;

  // Listados
  public tiposMovimientos: any[] = [];
  public saldos: any[] = [];
  public origenes: any[] = [];
  public destinos: any[] = [];
  public clientes: any[] = [];
  public proveedores: any[] = [];

  // Origen y Destino seleccionado
  public origen_seleccionado: any = null;
  public destino_seleccionado: any = null;

  // Datos de movimiento
  public tipo_movimiento = '';
  public monto = null;
  public tipo_origen = 'Interno';
  public origen = '';
  public tipo_destino = 'Interno';
  public destino = '';
  public observacion = '';

  // Movimientos
  public movimientos: any[] = [];
  public movimientoSeleccionado: any;

  // Paginacion
  public totalItems: number;
  public desde: number = 0;
  public paginaActual: number = 1;
  public cantidadItems: number = 10;

  // Filtrado
  public filtro = {
    tipo_movimiento: '',
    parametro: '',
  }

  // Ordenar
  public ordenar = {
    direccion: -1,  // Asc (1) | Desc (-1)
    columna: 'createdAt'
  }

  constructor(private movimientosService: MovimientosService,
              private authService: AuthService,
              private alertService: AlertService,
              private dataService: DataService) { }

  ngOnInit(): void {
    gsap.from('.gsap-contenido', { y:100, opacity: 0, duration: .2 });
    this.dataService.ubicacionActual = 'Dashboard - Movimientos';
    this.valoresIniciales();
  }

  listarMovimientos(): void {
    this.movimientosService.listarMovimientos(
      this.ordenar.direccion,
      this.ordenar.columna,
      this.desde,
      this.cantidadItems,
      'true',
      this.filtro.parametro,
      this.filtro.tipo_movimiento
    ).subscribe({
      next: ({movimientos, totalItems}) => {
        this.movimientos = movimientos;
        this.totalItems = totalItems;
        this.showModalCreacion = false;
        this.alertService.close();
      },error: ({error}) => this.alertService.errorApi(error.message)
    })
  }

  valoresIniciales(): void {
    this.alertService.loading();
    this.movimientosService.initMovimientos().subscribe({
      next: ({ data }) => {
        this.tiposMovimientos = data.tiposMovimientos;
        this.saldos = data.cajas;
        this.clientes = data.clientes;
        this.proveedores = data.proveedores;
        this.origenes = data.cajas;
        this.destinos = data.cajas;
        this.listarMovimientos();
      },
      error: ({error}) => this.alertService.errorApi(error.message)
    })
  }

  // Abrir modal de creacion
  abrirModalCreacion(): void {
    this.tipo_movimiento = '';
    this.monto = null;
    this.tipo_origen = 'Interno';
    this.tipo_destino = 'Interno';
    this.origen = '';
    this.destino = '';
    this.observacion = '';
    this.showModalCreacion = true;
  }

  // Seleccionar tipo de origen
  tipoOrigen(): void {
    this.origen = '';
    if(this.tipo_origen === 'Interno') this.origenes = this.saldos;
    else if(this.tipo_origen === 'Cliente') this.origenes = this.clientes;
    else if(this.tipo_origen === 'Proveedor') this.origenes = this.proveedores;
  }

  // Seleccionar tipo de destino
  tipoDestino(): void {
    this.destino = '';
    if(this.tipo_destino === 'Interno') this.destinos = this.saldos;
    else if(this.tipo_destino === 'Cliente') this.destinos = this.clientes;
    else if(this.tipo_destino === 'Proveedor') this.destinos = this.proveedores;
  }

  // Seleccionar origen
  seleccionarOrigen(): void {
    if(this.origen.trim() !== ''){
      this.origenes.map( origen => {
        if(String(origen._id) == String(this.origen)){
          this.origen_seleccionado = origen;
        }
      });
    }
  }

  // Seleccionar origen
  seleccionarDestino(): void {
    if(this.destino.trim() !== ''){
      this.destinos.map( destino => {
        if(String(destino._id) == String(this.destino)){
          this.destino_seleccionado = destino;
        }
      });
    }
  }

  // Generar movimiento
  generarMovimiento(): void {

    // Verificaciones

    if(this.tipo_movimiento.trim() === ''){
      this.alertService.info('Debe colocar un tipo de movimiento');
      return;
    }

    if(this.monto <= 0){
      this.alertService.info('Debe colocar un monto válido');
      return;
    }

    if(this.origen === ''){
      this.alertService.info('Debe seleccionar un origen');
      return;
    }

    if(this.destino === ''){
      this.alertService.info('Debe seleccionar un destino');
      return;
    }

    // Generacion de movimiento
    this.alertService.question({ msg: 'Esta por generar un movimiento', buttonText: 'Generar' })
        .then(({isConfirmed}) => {
          if (isConfirmed) {

            const data = {
              tipo_movimiento: this.tipo_movimiento,
              tipo_origen: this.tipo_origen,
              origen: this.origen,
              origen_descripcion: this.origen_seleccionado.descripcion,
              origen_monto_anterior: this.tipo_origen === 'Interno' ? this.dataService.redondear(this.origen_seleccionado.saldo, 2) : null,
              origen_monto_nuevo: this.tipo_origen === 'Interno' ? this.dataService.redondear(this.origen_seleccionado.saldo - this.monto, 2) : null,
              tipo_destino: this.tipo_destino,
              destino: this.destino,
              destino_descripcion: this.destino_seleccionado.descripcion,
              destino_monto_anterior: this.tipo_destino === 'Interno' ? this.dataService.redondear(this.destino_seleccionado.saldo, 2) : null,
              destino_monto_nuevo: this.tipo_destino === 'Interno' ? this.dataService.redondear(this.destino_seleccionado.saldo + this.monto, 2) : null,
              monto: this.monto,
              observacion: this.observacion,
              creatorUser: this.authService.usuario.userId,
              updatorUser: this.authService.usuario.userId,
            }

            this.alertService.loading();
            this.movimientosService.nuevoMovimiento(data).subscribe({
              next: () => {

                // Actualizacion de saldos
                if(this.tipo_origen === 'Interno'){
                  this.saldos.map( saldo => {
                    if(String(saldo._id) === String(this.origen)){
                      saldo.saldo = data.origen_monto_nuevo;
                    }
                  })
                }

                if(this.tipo_destino === 'Interno'){
                  this.saldos.map( saldo => {
                    if(String(saldo._id) === String(this.destino)){
                      saldo.saldo = data.destino_monto_nuevo;
                    }
                  })
                }

                this.listarMovimientos();

              }, error: ({error}) => this.alertService.errorApi(error.message)
            });

          }
        });

  }

  // Abrir detalles
  abrirDetalles(movimiento: any): void {
    window.scroll(0,0);
    this.movimientoSeleccionado = movimiento;
    this.showModalDetalles = true;
  }

  // Ordenar por fecha
  ordenarFecha(): void {
    this.ordenar.direccion = this.ordenar.direccion === -1 ? 1 : -1;
    this.cambiarPagina(1);
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
