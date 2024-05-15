import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { BancosService } from 'src/app/services/bancos.service';
import { CajasService } from 'src/app/services/cajas.service';
import { ClientesService } from 'src/app/services/clientes.service';
import { RecibosCobroService } from 'src/app/services/recibos-cobro.service';
import { VentasPropiasService } from 'src/app/services/ventas-propias.service';
import gsap from 'gsap';
import { environment } from 'src/environments/environment';
import { VentasPropiasProductosService } from 'src/app/services/ventas-propias-productos.service';
import { VentasPropiasChequesService } from 'src/app/services/ventas-propias-cheques.service';
import { format } from 'date-fns';
import { DataService } from 'src/app/services/data.service';
import { CcClientesService } from 'src/app/services/cc-clientes.service';

const base_url = environment.base_url;

@Component({
  selector: 'app-nuevo-cobro',
  templateUrl: './nuevo-cobro.component.html',
  styles: []
})
export class NuevoCobroComponent implements OnInit {

  public fecha_cobro: string = format(new Date(),'yyyy-MM-dd');

  // CUENTA CORRIENTE
  public flagCC = false;
  public cuentaCorriente = null;

  // MODALS
  public showModalCobro = false;
  public showModalCobroParcial = false;
  public showModalDetallesVenta = false;
  public showModalDetallesCheque = false;

  // ETAPAS
  public etapa: string = 'clientes';

  // CLIENTES
  public clientes: any[] = [];
  public clienteSeleccionado: any = null;

  // VENTAS
  public montoTotal: number = 0;
  public montoTotalCobrado: number = 0;
  public montoParcial: number = 0;
  public ventas: any[] = [];
  public ventaSeleccionada: any = null;

  // CARRO DE PAGO
  public carro_pago: any[] = [];

  // FORMAS DE PAGO
  public formas_pago: any[] = [];
  public forma_pago: string = '';
  public forma_pago_monto: number = null;

  // CHEQUES
  public showDetallesCheque = false;
  public showModalCheque = false;
  public cheques: any[] = [];
  public chequeSeleccionado: any;
  public estadoFormularioCheque = 'crear';
  public bancos: any[] = [];

  // VETA PROPIA
  public ventaPropia: any;
  public productos: any[];
  public relaciones: any[];  // Relaciones venta_propia = cheques
  public chequeSeleccionadoDetalles: any;

  // SELECT PERSONALIZADO
  showOptions = false;

  public cheque = {
    nro_cheque: '',
    emisor: '',
    banco: '',
    banco_descripcion: '',
    importe: null,
    fecha_cobro: ''
  }

  public filtro = {
    parametroProducto: '',
    parametroCliente: ''
  }

  // CAJAS
  public cajas: any[] = [];

  constructor(
    public authService: AuthService,
    private dataService: DataService,
    private ventasPropiasProductosService: VentasPropiasProductosService,
    private ventasPropiasChequesService: VentasPropiasChequesService,
    private clientesService: ClientesService,
    private ccClientesService: CcClientesService,
    private cobrosService: RecibosCobroService,
    private cajasService: CajasService,
    private bancosService: BancosService,
    private ventasPropiasService: VentasPropiasService,
    private alertService: AlertService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Nuevo cobro';
    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.cargaInicial();
  }

  // ? ---------> CARGA INICIAL

  // ** CARGA DE DATOS INICIALES
  cargaInicial(): void {
    this.alertService.loading();
    this.clientesService.listarClientes().subscribe({
      next: ({ clientes }) => {
        
        this.clientes = clientes.filter(cliente => cliente.activo);

        // Listado de cajas
        this.cajasService.listarCajas().subscribe({
          next: ({ cajas }) => {
            this.cajas = cajas.filter(caja => caja._id !== '222222222222222222222222' && caja.activo);
            if (this.authService.usuario.role !== 'ADMIN_ROLE')
            this.cajas = this.cajas.filter(caja => this.authService.usuario.permisos_cajas.includes(caja._id.toString()))
            this.alertService.close();
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // ? ---------> SECCION CLIENTES

  // ** SELECCIONAR CLIENTE
  seleccionarCliente(cliente: any): void {
    this.clienteSeleccionado = cliente;
  }

  borrarCliente(): void {
    this.clienteSeleccionado = null;
    this.filtro.parametroCliente = '';
  }

  // ? ---------? SECCION COBRO

  // ** AGREGAR VENTA -> CARRO DE PAGO
  agregarVenta(venta: any): void {

    venta.seleccionada = !venta.seleccionada ? true : false;
    venta.cancelada = true;

    if (venta.seleccionada) {                   // Agregar venta -> carro de pago

      const dataVenta = {
        venta: venta._id,
        total_deuda: venta.deuda_monto,
        monto_cobrado: venta.deuda_monto,
        monto_deuda: 0,
        cancelada: true,
      }

      this.carro_pago.unshift(dataVenta);

    } else {                                    // Eliminar venta -> carro de pago
      this.carro_pago = this.carro_pago.filter(elemento => String(elemento.venta) !== String(venta._id));
    }

    this.calculoMontoTotalCobro();

  }

  // ** CALCULO -> MONTO TOTAL A COBRAR
  calculoMontoTotalCobro(): void {
    let montoTMP = 0;
    this.carro_pago.map(elemento => {
      montoTMP += elemento.monto_cobrado;
    });
    this.montoTotal = montoTMP;
  }

  // ** CALCULO -> MONTO TOTAL COBRADO
  calculoMontoTotalACobrar(): void {

    let montoTMP = 0;

    // Formas de pago
    this.formas_pago.map(elemento => {
      montoTMP += elemento.monto;
    });

    // Cheques
    this.cheques.map(elemento => {
      montoTMP += elemento.importe
    })

    // Calculo -> Falta cobrar
    this.forma_pago_monto = (this.montoTotal - montoTMP) > 0 ? (this.montoTotal - montoTMP) : null;
    this.forma_pago = '';

    this.montoTotalCobrado = montoTMP;

  }

  // ** ABRIR MODAL -> COMPLETANDO COBRO
  abrirModalCobro(): void {
    this.fecha_cobro = format(new Date(),'yyyy-MM-dd');
    this.formas_pago = [];
    this.cheques = [];
    this.forma_pago = '';
    this.forma_pago_monto = this.montoTotal;
    this.showModalCobro = true;
  }

  // ** AGREGAR FORMA DE PAGO
  agregarFormaPago(): void {

    // Verificacion: Forma de pago seleccionada
    if (this.forma_pago === '') {
      this.alertService.info('Debe seleccionar una forma de pago');
      return;
    }

    // Verificacion: Monto válido
    if (this.forma_pago_monto <= 0) {
      this.alertService.info('Debe colocar un monto válido');
      return;
    }

    // Verificacion: Forma de pago ya agregada
    const forma_pago = this.formas_pago.find(elemento => String(elemento._id) === this.forma_pago);
    if (forma_pago) {
      this.alertService.info('La forma de pago ya fue agregada');
      return;
    }

    this.formas_pago.unshift({
      _id: this.forma_pago,
      descripcion: this.cajas.find(caja => String(caja._id) === this.forma_pago)?.descripcion,
      monto: this.forma_pago_monto
    })

    this.calculoMontoTotalACobrar();

  }

  // ** ELIMINAR FORMA DE PAGO
  eliminarFormaPago(forma_pago: any): void {
    this.formas_pago = this.formas_pago.filter(elemento => String(elemento._id) !== forma_pago._id);
    this.calculoMontoTotalACobrar();
  }

  // ** ABRIR MODAL -> CHEQUES
  abrirModalCheque(estado, cheque = null): void {
    this.alertService.loading();
    this.estadoFormularioCheque = estado;

    if (estado === 'editar') {
      this.chequeSeleccionado = cheque;
      this.cheque = cheque;
    } else {
      // Reinicio de formulario de cheque
      this.chequeSeleccionado = null;
      this.cheque = {
        nro_cheque: '',
        importe: null,
        emisor: '',
        banco: '',
        banco_descripcion: '',
        fecha_cobro: ''
      }
    }

    this.bancosService.listarBancos().subscribe({
      next: ({ bancos }) => {
        this.bancos = bancos.filter(banco => banco.activo);
        this.showModalCobro = false;
        this.showModalCheque = true;
        this.alertService.close();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // ** CERRAR MODAL -> CHEQUE
  cerrarModalCheque(): void {
    this.showModalCheque = false;
    this.showModalCobro = true;
  }

  //** AGREGAR CHEQUE
  agregarCheque(): void {

    // Verificacion: Numero de cheque vacio
    if (this.cheque.nro_cheque.trim() === "") {
      this.alertService.info('Debes colocar un número de cheque');
      return;
    }

    // Verificacion: importe vacio
    if (!this.cheque.importe || this.cheque.importe < 0) {
      this.alertService.info('Debes colocar un importe válido');
      return;
    }

    // Verificacion: emisor vacio
    if (this.cheque.emisor.trim() === '') {
      this.alertService.info('Debes colocar un emisor');
      return;
    }

    // Verificacion: banco vacio
    if (this.cheque.banco.trim() === '') {
      this.alertService.info('Debes colocar un banco');
      return;
    }

    // Verificacion: fecha de cobro vacia
    if (this.cheque.fecha_cobro.trim() === '') {
      this.alertService.info('Debes colocar una fecha de cobro');
      return;
    }

    // Agregando cheque
    this.cheques.unshift({
      ...this.cheque,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    });

    this.calculoMontoTotalACobrar();

    this.cerrarModalCheque();

  }

  //** ACTUALIZAR CHEQUE
  actualizarCheque(): void {

    // Verificacion: Numero de cheque vacio
    if (this.cheque.nro_cheque.trim() === "") {
      this.alertService.info('Debes colocar un número de cheque');
      return;
    }

    // Verificacion: importe vacio
    if (!this.cheque.importe || this.cheque.importe < 0) {
      this.alertService.info('Debes colocar un importe válido');
      return;
    }

    // Verificacion: emisor vacio
    if (this.cheque.emisor.trim() === '') {
      this.alertService.info('Debes colocar un emisor');
      return;
    }

    // Verificacion: banco vacio
    if (this.cheque.banco.trim() === '') {
      this.alertService.info('Debes colocar un banco');
      return;
    }

    // Verificacion: fecha de cobro vacia
    if (this.cheque.fecha_cobro.trim() === '') {
      this.alertService.info('Debes colocar una fecha de cobro');
      return;
    }

    // Se aplican los cambios al cheque
    this.cheques.map(cheque => {
      if (cheque._id === this.chequeSeleccionado) {
        cheque = this.cheque;
      }
    })

    this.calculoMontoTotalACobrar();

    this.cerrarModalCheque();

  }

  //** ELIMINAR CHEQUE
  eliminarCheque(cheque): void {
    this.cheques = this.cheques.filter(elemento => elemento._id !== cheque._id);
    this.calculoMontoTotalACobrar();
  }

  //** SELECCIONAR BANCO
  seleccionarBanco(): void {
    if (this.cheque.banco.trim() !== '') {
      this.bancos.map(banco => {
        if (banco._id === this.cheque.banco) {
          this.cheque.banco_descripcion = banco.descripcion;
          return;
        }
      });
    } else {
      this.cheque.banco_descripcion = '';
    }
  }

  //** GENERANDO COBRO
  generarCobro(): void {
    
    // Verificacion: No hay formas de pago agregada
    if (this.formas_pago.length === 0 && this.cheques.length === 0) {
      this.alertService.info('Se debe agregar al menos una forma de pago');
      return;
    }

    // Verificacion: Monto inferior al que se debe cobrar
    if (this.montoTotal > this.montoTotalCobrado) {
      this.alertService.info('Monto cobrado inferior al total');
      return;
    }

    this.alertService.question({ msg: 'Generando cobro', buttonText: 'Cobrar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {

          // Generar cobror
          this.alertService.loading();

          const data = {
            cliente: this.clienteSeleccionado._id,
            fecha_cobro: this.fecha_cobro,
            formas_pago: this.formas_pago,
            cobro_total: this.montoTotalCobrado,
            carro_pago: this.carro_pago,
            cheques: this.cheques,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId,
          };

          this.cobrosService.nuevoRecibo(data).subscribe({
            next: () => {
              window.open(`${base_url}/pdf/recibo_cobro.pdf`, '_blank');
              this.reiniciarSeccion();
              this.authService.getCaja();
              this.alertService.close();
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          });

        }
      });

  }

  // Reiniciar seccion
  reiniciarSeccion(): void {
    this.etapa = 'clientes';
    this.filtro.parametroCliente = '';
    this.clienteSeleccionado = null;
    this.showModalCobro = false;
    this.showOptions = false;
  }

  // Abrir cobro parcial
  abrirCobroParcial(venta: any): void {
    this.montoParcial = null;
    this.ventaSeleccionada = venta;
    this.showModalCobroParcial = true;
  }

  // Cerrar cobro parcial
  cerrarCobroParcial(): void {
    this.showModalCobroParcial = false;
  }

  // Cobrar parcialmente
  cobrarParcialmente(): void {

    if (this.ventaSeleccionada.deuda_monto < this.montoParcial) {
      this.alertService.info('No se puede superar el monto de deuda');
      return;
    }

    if (this.ventaSeleccionada.deuda_monto === this.montoParcial) { // Se cancela la deuda

      this.ventaSeleccionada.seleccionada = true;
      this.ventaSeleccionada.cancelada = true;
      this.ventaSeleccionada.monto_cobrado = this.montoParcial;


    } else {  // Pago parcial

      this.ventaSeleccionada.seleccionada = true;
      this.ventaSeleccionada.cancelada = false;
      this.ventaSeleccionada.monto_cobrado = this.montoParcial;

    }

    const dataVenta = {
      venta: this.ventaSeleccionada._id,
      total_deuda: this.ventaSeleccionada.deuda_monto,
      monto_cobrado: this.montoParcial,
      monto_deuda: this.ventaSeleccionada.deuda_monto - this.montoParcial,
      cancelada: false,
    }

    this.carro_pago.unshift(dataVenta);

    this.calculoMontoTotalCobro();

    this.montoParcial = null;

    this.showModalCobroParcial = false;

  }

  //** DETALLES DE VENTA PROPIA

  // Abrir detalles de venta
  abrirDetallesVenta(venta: any): void {
    this.alertService.loading();
    this.ventaPropia = venta;
    this.ventasPropiasProductosService.listarProductos({ venta: venta._id }).subscribe({
      next: ({ productos }) => {
        this.productos = productos;

        this.ventasPropiasChequesService.listarRelaciones({ venta_propia: venta._id }).subscribe({
          next: ({ relaciones }) => {

            this.relaciones = relaciones;

            this.showModalDetallesVenta = true;

            this.alertService.close();

          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Cerrar detalles de venta
  cerrarDetallesVenta(): void {
    this.showModalDetallesVenta = false;
  }

  // Abrir detalles de cheque
  abrirDetallesCheque(cheque: any): void {
    this.chequeSeleccionado = cheque;
    this.showModalDetallesVenta = false;
    this.showModalDetallesCheque = true;
  }

  // Cerrar el detalles del cheque
  cerrarDetallesCheque(): void {
    this.showModalDetallesCheque = false;
    this.showModalDetallesVenta = true;
  }

  // Generar PDF
  generarPDF(venta: any): void {
    this.alertService.loading();
    this.ventasPropiasService.generarPDF({ venta: venta._id }).subscribe({
      next: () => {
        window.open(`${base_url}/pdf/venta-propia.pdf`, '_blank');
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // ? ---------> CAMBIO DE ETAPA

  // ** CAMBIO DE ETAPA: 'clientes' -> 'cobro'
  cambioEtapaCobro(): void {

    if (!this.clienteSeleccionado) {
      this.alertService.info('Debe seleccionar un cliente');
      return;
    }

    // Reiniciar valores cuenta corriente
    this.flagCC = false;
    this.cuentaCorriente = null;

    // Reiniciando carro de pago
    this.montoTotal = 0;
    this.carro_pago = [];

    // Cambiando de etapa
    this.alertService.loading();
    this.ventas = [];

    // Cuenta corriente
    this.ccClientesService.getCuentaCorrientePorCliente(this.clienteSeleccionado._id).subscribe({
      next: ({cuenta_corriente}) => {
    
        if(cuenta_corriente){
          this.flagCC = true;
          this.cuentaCorriente = cuenta_corriente;
        }

        // Listado de ventas 
        this.ventasPropiasService.listarVentas({ cliente: this.clienteSeleccionado._id, cancelada: 'false', activo: true }).subscribe({
          next: ({ ventas }) => {
            this.ventas = ventas;
            this.etapa = 'cobro';
            this.alertService.close();
          },
          error: ({ error }) => this.alertService.errorApi(error.message)
        });

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Generar cuenta corriente
  generarCuentaCorriente(): void {
    this.alertService.question({ msg: `Creando cuenta corriente para ${this.clienteSeleccionado.descripcion}`, buttonText: 'Crear' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          const data = {
            cliente: this.clienteSeleccionado._id,
            saldo: 0,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId,
          }
          this.ccClientesService.nuevaCuentaCorriente(data).subscribe({
            next: ({cuenta_corriente}) => {
              this.flagCC = true;
              this.cuentaCorriente = cuenta_corriente;
              this.alertService.success('Cuenta corriente creada correctamente');
            }, error: ({error}) => this.alertService.errorApi(error.message)
          })
        }
    });
  }


}
