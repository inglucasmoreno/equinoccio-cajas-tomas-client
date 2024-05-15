import { Component, OnInit } from '@angular/core';
import { format } from 'date-fns';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { BancosService } from 'src/app/services/bancos.service';
import { CajasService } from 'src/app/services/cajas.service';
import { ComprasChequesService } from 'src/app/services/compras-cheques.service';
import { ComprasProductosService } from 'src/app/services/compras-productos.service';
import { ComprasService } from 'src/app/services/compras.service';
import { OrdenesPagoService } from 'src/app/services/ordenes-pago.service';
import { ProveedoresService } from 'src/app/services/proveedores.service';
import { environment } from 'src/environments/environment';
import gsap from 'gsap';
import { ChequesService } from 'src/app/services/cheques.service';
import { DataService } from 'src/app/services/data.service';
import { CcProveedoresService } from 'src/app/services/cc-proveedores.service';

const base_url = environment.base_url;

@Component({
  selector: 'app-nuevo-pago',
  templateUrl: './nuevo-pago.component.html',
  styles: [
  ]
})
export class NuevoPagoComponent implements OnInit {

  public fecha_pago: string = format(new Date(), 'yyyy-MM-dd');

  // FLAGS
  public showOptions = false;
  public flagCC = false;

  // CUENTA CORRIENTE
  public cuentaCorriente = null;

  // MODALS
  public showCheques = false;
  public showModalPago = false;
  public showModalPagoParcial = false;
  public showModalDetallesCompra = false;
  public showModalDetallesCheque = false;

  // ETAPAS
  public etapa: string = 'proveedores';

  // PROVEEDORES
  public proveedores: any[] = [];
  public proveedorSeleccionado: any = null;

  // COMPRAS
  public montoTotal: number = 0;
  public montoTotalPagado: number = 0;
  public montoParcial: number = 0;
  public compras: any[] = [];
  public compraSeleccionada: any = null;

  // CARRO DE PAGO
  public carro_pago: any[] = [];

  // FORMAS DE PAGO
  public formas_pago: any[] = [];
  public forma_pago: string = '';
  public forma_pago_monto: number = null;

  // CHEQUES
  public falgInicioCheques: boolean = true;
  public totalTmpCheques: number = 0;
  public showDetallesCheque = false;
  public showModalCheque = false;
  public listaCheques: any[] = [];
  public cheques: any[] = [];
  public chequeSeleccionado: any;
  public estadoFormularioCheque = 'crear';
  public bancos: any[] = [];

  // COMPRA
  public compra: any;
  public productos: any[];
  public relaciones: any[];  // Relaciones compra = cheques
  public chequeSeleccionadoDetalles: any;

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
    parametroProveedor: ''
  }

  // CAJAS
  public cajas: any[] = [];

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private comprasProductosService: ComprasProductosService,
    private comprasChequesService: ComprasChequesService,
    private proveedoresService: ProveedoresService,
    private ccProveedoresService: CcProveedoresService,
    private ordenesPagoService: OrdenesPagoService,
    private cajasService: CajasService,
    private chequesService: ChequesService,
    private bancosService: BancosService,
    private comprasService: ComprasService,
    private alertService: AlertService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Nuevo pago';
    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.cargaInicial();
  }

  // ? ---------> CARGA INICIAL

  // ** CARGA DE DATOS INICIALES
  cargaInicial(): void {
    this.alertService.loading();
    this.proveedoresService.listarProveedores().subscribe({
      next: ({ proveedores }) => {

        this.proveedores = proveedores.filter(proveedor => proveedor.activo);

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

  // ? ---------> SECCION PROVEEDORES


  // ** SELECCIONAR PROVEEDOR
  seleccionarProveedor(proveedor: any): void {
    this.proveedorSeleccionado = proveedor;
  }

  borrarProveedor(): void {
    this.proveedorSeleccionado = null;
    this.filtro.parametroProveedor = '';
  }

  // ? ---------? SECCION PAGO

  // ** AGREGA COMPRA -> CARRO DE PAGO
  agregarCompra(compra: any): void {

    compra.seleccionada = !compra.seleccionada ? true : false;
    compra.cancelada = true;

    if (compra.seleccionada) {                   // Agregar compra -> carro de pago

      const dataCompra = {
        compra: compra._id,
        total_deuda: compra.monto_deuda,
        monto_pagado: compra.monto_deuda,
        monto_deuda: 0,
        cancelada: true,
      }

      this.carro_pago.unshift(dataCompra);

    } else {                                    // Eliminar compra -> carro de pago
      this.carro_pago = this.carro_pago.filter(elemento => String(elemento.compra) !== String(compra._id));
    }

    this.calculoMontoTotalPagar();

  }

  // ** CALCULO -> MONTO TOTAL A PAGAR
  calculoMontoTotalPagar(): void {
    let montoTMP = 0;
    this.carro_pago.map(elemento => {
      montoTMP += elemento.monto_pagado;
    });
    this.montoTotal = montoTMP;
  }

  // ** CALCULO -> MONTO TOTAL PAGADO
  calculoMontoTotalAPagar(): void {

    let montoTMP = 0;

    // Formas de pago
    this.formas_pago.map(elemento => {
      montoTMP += elemento.monto;
    });

    // Cheques
    this.cheques.map(elemento => {
      montoTMP += elemento.importe
    })

    // Calculo -> Falta pagar
    this.forma_pago_monto = (this.montoTotal - montoTMP) > 0 ? (this.montoTotal - montoTMP) : null;
    this.forma_pago = '';

    this.montoTotalPagado = montoTMP;

  }

  // ** ABRIR MODAL -> COMPLETANDO PAGO
  abrirModalPago(): void {
    this.fecha_pago = format(new Date(), 'yyyy-MM-dd');
    this.limpiarCheques();
    this.formas_pago = [];
    this.cheques = [];
    this.forma_pago = '';
    this.forma_pago_monto = this.montoTotal;
    this.showModalPago = true;
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

    let excesoMonto = '';

    // Verificacion de exceso de monto
    this.cajas.map(caja => {
      if (caja._id === this.forma_pago && caja.saldo < this.forma_pago_monto) excesoMonto = caja.descripcion;
    });

    if (excesoMonto.trim() !== '') {
      this.alertService.info(`No tienes suficiente saldo en la caja ${excesoMonto}`);
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

    this.calculoMontoTotalAPagar();

  }

  // ** ELIMINAR FORMA DE PAGO
  eliminarFormaPago(forma_pago: any): void {
    this.formas_pago = this.formas_pago.filter(elemento => String(elemento._id) !== forma_pago._id);
    this.calculoMontoTotalAPagar();
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
        this.showModalPago = false;
        this.showModalCheque = true;
        this.alertService.close();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // ** CERRAR MODAL -> CHEQUE
  cerrarModalCheque(): void {
    this.showModalCheque = false;
    this.showModalPago = true;
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

    this.calculoMontoTotalAPagar();

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

    this.calculoMontoTotalAPagar();

    this.cerrarModalCheque();

  }

  //** ELIMINAR CHEQUE
  eliminarCheque(cheque): void {
    this.cheques = this.cheques.filter(elemento => elemento._id !== cheque._id);
    this.listaCheques.map(elemento => elemento._id === cheque._id ? elemento.seleccionado = false : null);
    this.calculoMontoTotalAPagar();
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

  //** GENERANDO PAGO
  generarPago(): void {

    // Verificacion: No hay formas de pago agregada
    if (this.formas_pago.length === 0 && this.cheques.length === 0) {
      this.alertService.info('Se debe agregar al menos una forma de pago');
      return;
    }

    // Verificacion: Monto inferior al que se debe pagar
    if (this.montoTotal > this.montoTotalPagado) {
      this.alertService.info('Monto pagado inferior al total');
      return;
    }

    this.alertService.question({ msg: 'Generando pago', buttonText: 'Pagar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {

          // Generar pago
          this.alertService.loading();

          const data = {
            proveedor: this.proveedorSeleccionado._id,
            fecha_pago: this.fecha_pago,
            formas_pago: this.formas_pago,
            pago_total: this.montoTotalPagado,
            carro_pago: this.carro_pago,
            cheques: this.cheques,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId,
          };

          this.ordenesPagoService.nuevaOrdenPago(data).subscribe({
            next: () => {
              window.open(`${base_url}/pdf/orden_pago.pdf`, '_blank');
              this.reiniciarSeccion();
              this.alertService.close();
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          });

        }
      });

  }

  // Reiniciar seccion
  reiniciarSeccion(): void {
    this.etapa = 'proveedores';
    this.proveedorSeleccionado = null;
    this.filtro.parametroProveedor = '';
    this.showOptions = false;
    this.showModalPago = false;
  }

  // Abrir pago parcial
  abrirPagoParcial(compra: any): void {
    this.montoParcial = null;
    this.compraSeleccionada = compra;
    this.showModalPagoParcial = true;
  }

  // Cerrar pago parcial
  cerrarPagoParcial(): void {
    this.showModalPagoParcial = false;
  }

  // Pago parcialmente
  pagarParcialmente(): void {

    if (this.compraSeleccionada.monto_deuda < this.montoParcial) {
      this.alertService.info('No se puede superar el monto de deuda');
      return;
    }

    if (this.compraSeleccionada.monto_deuda === this.montoParcial) { // Se cancela la deuda

      this.compraSeleccionada.seleccionada = true;
      this.compraSeleccionada.cancelada = true;
      this.compraSeleccionada.monto_pagado = this.montoParcial;


    } else {  // Pago parcial

      this.compraSeleccionada.seleccionada = true;
      this.compraSeleccionada.cancelada = false;
      this.compraSeleccionada.monto_pagado = this.montoParcial;

    }

    const dataCompra = {
      compra: this.compraSeleccionada._id,
      total_deuda: this.compraSeleccionada.monto_deuda,
      monto_pagado: this.montoParcial,
      monto_deuda: this.compraSeleccionada.monto_deuda - this.montoParcial,
      cancelada: false,
    }

    this.carro_pago.unshift(dataCompra);

    this.calculoMontoTotalPagar();

    this.montoParcial = null;

    this.showModalPagoParcial = false;

  }

  //** DETALLES DE COMPRA

  // Abrir detalles de compra
  abrirDetallesCompra(compra: any): void {
    this.alertService.loading();
    this.compra = compra;
    this.comprasProductosService.listarProductos({ compra: compra._id }).subscribe({
      next: ({ productos }) => {
        this.productos = productos;

        this.comprasChequesService.listarRelaciones({ compra: compra._id }).subscribe({
          next: ({ relaciones }) => {

            this.relaciones = relaciones;

            this.showModalDetallesCompra = true;

            this.alertService.close();

          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Cerrar detalles de compra
  cerrarDetallesCompra(): void {
    this.showModalDetallesCompra = false;
  }

  // Abrir detalles de cheque
  abrirDetallesCheque(cheque: any): void {
    this.chequeSeleccionado = cheque;
    this.showModalDetallesCompra = false;
    this.showModalDetallesCheque = true;
  }

  // Cerrar el detalles del cheque
  cerrarDetallesCheque(): void {
    this.showModalDetallesCheque = false;
    this.showModalDetallesCompra = true;
  }

  // Generar PDF
  generarPDF(compra: any): void {
    this.alertService.loading();
    this.comprasService.generarPDF({ compra: compra._id }).subscribe({
      next: () => {
        window.open(`${base_url}/pdf/compra.pdf`, '_blank');
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // ? ---------> CAMBIO DE ETAPA

  // ** CAMBIO DE ETAPA: 'proveedores' -> 'pago'
  cambioEtapaPago(): void {

    if (!this.proveedorSeleccionado) {
      this.alertService.info('Debe seleccionar un proveedor');
      return;
    }

    // Datos de cuenta corriente
    this.cuentaCorriente = null;
    this.flagCC = false;

    // Reiniciando carro de pago
    this.montoTotal = 0;
    this.carro_pago = [];

    // Cambiando de etapa
    this.alertService.loading();
    this.compras = [];

    // Tiene cuenta corriente?
    this.ccProveedoresService.getCuentaCorrientePorProveedor(this.proveedorSeleccionado._id).subscribe({
      next: ({ cuenta_corriente }) => {

        if (cuenta_corriente) {
          this.cuentaCorriente = cuenta_corriente;
          this.flagCC = true;
        }

        // Listado de compras
        this.comprasService.listarCompras({ proveedor: this.proveedorSeleccionado._id, cancelada: 'false', activo: true }).subscribe({
          next: ({ compras }) => {
            this.compras = compras;
            this.etapa = 'pago';
            this.alertService.close();
          },
          error: ({ error }) => this.alertService.errorApi(error.message)
        });

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })


  }

  // Abrir listado de cheques
  abrirListaCheques(): void {

    if (this.falgInicioCheques) {
      this.alertService.loading();
      this.totalTmpCheques = 0;
      this.chequesService.listarCheques({ estado: 'Creado', direccion: 1, columna: 'fecha_cobro' }).subscribe({
        next: ({ cheques }) => {
          cheques.map(cheque => {
            this.listaCheques.unshift({
              ...cheque,
              seleccionado: false
            })
          });
          this.showModalPago = false;
          this.falgInicioCheques = false;
          this.showCheques = true;
          this.alertService.close();
        }, error: ({ error }) => this.alertService.errorApi(error.message)
      })
    } else {
      this.showModalPago = false;
      this.falgInicioCheques = false;
      this.showCheques = true;
    }
  }

  // Seleccionar cheque
  seleccionarCheque(cheque: any): void {
    cheque.seleccionado = cheque.seleccionado ? false : true;
    this.calcularTotalEnCheques();
  }

  // Finalizar seleccion de cheques
  finalizarSeleccionCheques(): void {
    this.cheques = [];
    this.listaCheques.map(cheque => {
      cheque.seleccionado ? this.cheques.push(cheque) : null;
    })
    this.calculoMontoTotalAPagar();
    this.showCheques = false;
    this.showModalPago = true;
  }

  // Generar cuenta corriente
  generarCuentaCorriente(): void {
    this.alertService.question({ msg: `Creando cuenta corriente en ${this.proveedorSeleccionado.descripcion}`, buttonText: 'Crear' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          const data = {
            proveedor: this.proveedorSeleccionado._id,
            saldo: 0,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId,
          }
          this.ccProveedoresService.nuevaCuentaCorriente(data).subscribe({
            next: ({ cuenta_corriente }) => {
              this.flagCC = true;
              this.cuentaCorriente = cuenta_corriente;
              this.alertService.success('Cuenta corriente creada correctamente');
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });
  }

  // Calcular total en cheques
  calcularTotalEnCheques(): void {
    this.totalTmpCheques = 0;
    this.listaCheques.map(cheque => {
      cheque.seleccionado ? this.totalTmpCheques += cheque.importe : null;
    });
  }

  // Cerrar listado de cheques
  cerrarListaCheques(): void {
    this.showModalPago = true;
    this.showCheques = false;
  }

  // Limpiar cheques seleccionados
  limpiarCheques(): void {
    this.listaCheques.map(cheque => {
      cheque.seleccionado = false;
    })
  }


}
