import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { ClientesService } from 'src/app/services/clientes.service';
import { DataService } from 'src/app/services/data.service';
import { ProductosService } from 'src/app/services/productos.service';
import { ProveedoresService } from 'src/app/services/proveedores.service';
import { VentasService } from 'src/app/services/ventas.service';
import { environment } from 'src/environments/environment';
import gsap from 'gsap';
import { CajasService } from 'src/app/services/cajas.service';
import { CcClientesService } from 'src/app/services/cc-clientes.service';
import { BancosService } from 'src/app/services/bancos.service';
import { VentasPropiasService } from 'src/app/services/ventas-propias.service';
import { format } from 'date-fns';

const base_url = environment.base_url;

@Component({
  selector: 'app-nueva-venta',
  templateUrl: './nueva-venta.component.html',
  styles: [
  ]
})
export class NuevaVentaComponent implements OnInit {

  // Flag
  public showOptionsClientes = false;

  // Porcentajes
  public porcentajes = '';
  public porcentajeAplicado = false;
  public porcentajeAplicadoTotal = false;
  public porcentajesTotal = '';

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showClientes = false;
  public showNuevoCliente = false;
  public showProductos = false;
  public showEditarProducto = false;
  public showFormaPago = false;

  // Clientes
  public clientes: any[] = [];
  public clienteSeleccionado: any = null;

  // Proveedores
  public proveedores: any[] = [];

  // Tipo de venta
  public tipo_venta = 'Directa';
  public tipo_cliente = 'consumidor_final';

  // Cajas
  public cajas: any[] = [];

  // Flags
  public etapa = 'tipo_venta';
  public productoCargado = false;
  public flagCC = false;
  public montoFijo = false;

  // Formulario de cliente
  public clientesForm: any = {
    descripcion: '',
    tipo_identificacion: 'DNI',
    identificacion: '',
    direccion: '',
    telefono: '',
    correo_electronico: '',
    condicion_iva: 'Consumidor Final'
  }

  // Venta
  public nro_factura = '';
  public proveedor = '';
  public precio_total = 0;
  public observacion: string = '';

  // Venta propia
  public fecha_venta: string = format(new Date(), 'yyyy-MM-dd');
  public incrementoCC: boolean = false;
  public totalPagado: number = 0;
  public cancelada: boolean = true;
  public deuda_monto: number = 0;
  public forma_pago: string = '';
  public forma_pago_monto: number = null;
  public formas_pago: any[] = [];
  public cheques: any[] = [];
  public formaPagoSeleccionada: any = null;
  public estadoCuentaCorriente: string = 'No tiene'; // Tiene | No tiene | No exite

  // Cuenta corriente - Cliente
  public datosCliente: any = null;
  public cuenta_corriente: any = null;

  // Bancos
  public bancos: any[] = [];

  // Cheque
  public showModalCheque = false;
  public estadoFormularioCheque = 'crear';
  public chequeSeleccionado = null;

  public cheque = {
    nro_cheque: '',
    emisor: '',
    banco: '',
    banco_descripcion: '',
    importe: null,
    fecha_cobro: ''
  }

  // Productos
  public productos: any[] = [];
  public productosVenta: any[] = [];
  public productoSeleccionado: any = null;
  public cantidad: number = null;
  public precio: number = null;
  public precioResguardo: number = null;

  // Paginacion - Clientes
  public totalItemsClientes: number;
  public desdeClientes: number = 0;
  public paginaActualClientes: number = 1;
  public cantidadItemsClientes: number = 10;

  // Paginacion - Productos
  public totalItemsProductos: number;
  public desdeProductos: number = 0;
  public paginaActualProductos: number = 1;
  public cantidadItemsProductos: number = 10;

  // Filtrado
  public filtro = {
    activo: 'true',
    parametro: '',
    parametroProductos: '',
    parametroCliente: ''
  }

  // Ordenar
  public ordenar = {
    direccion: 1,  // Asc (1) | Desc (-1)
    columna: 'descripcion'
  }

  constructor(private clientesService: ClientesService,
    public authService: AuthService,
    private proveedoresService: ProveedoresService,
    private ventasService: VentasService,
    private ventasPropiasService: VentasPropiasService,
    private productosService: ProductosService,
    private alertService: AlertService,
    private bancosService: BancosService,
    private ccClientesService: CcClientesService,
    private cajasService: CajasService,
    private dataService: DataService) { }

  // Inicio del componente
  ngOnInit(): void {
    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.dataService.ubicacionActual = 'Dashboard - Nueva venta';
    this.recuperarLocalStorage();
    this.alertService.loading();
    this.proveedoresService.listarProveedores().subscribe({
      next: ({ proveedores }) => {
        this.proveedores = proveedores.filter(proveedor => proveedor.activo);
        this.listarClientes();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    });
  }

  // Listar clientes
  listarClientes(): void {
    this.clientesService.listarClientes({
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      activo: this.filtro.activo,
      parametro: this.filtro.parametro,
    }).subscribe({
      next: ({ clientes, totalItems }) => {
        this.clientes = clientes;
        this.totalItemsClientes = totalItems;
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Listar productos
  listarProductos(): void {
    this.alertService.loading();
    this.productosService.listarProductos({
      desde: this.desdeProductos,
      cantidadItems: this.cantidadItemsProductos,
      parametro: this.filtro.parametroProductos,
      activo: true
    }).subscribe({
      next: ({ productos, totalItems }) => {
        this.totalItemsProductos = totalItems;
        this.productos = productos;
        this.alertService.close();
        this.showProductos = true;
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Buscar productos
  buscarProductos(): void {
    this.productoSeleccionado = null;
    this.cantidad = null;
    this.filtro.parametroProductos = '';
    this.cantidadItemsProductos = 10;
    this.listarProductos();
  }

  // Seleccionar cliente
  // seleccionarCliente(cliente: any): void {
  //   this.clienteSeleccionado = cliente;
  //   this.clientesForm = cliente;
  //   this.showClientes = false;
  //   this.almacenamientoLocalStorage();
  // }

  // Seleccionar cliente del listado
  seleccionarCliente(cliente: any): void {
    this.clienteSeleccionado = cliente;
    this.almacenamientoLocalStorage();
  }

  // Eliminar cliente seleccionado
  borrarCliente(): void {
    this.clienteSeleccionado = null;
    this.filtro.parametroCliente = '';
    this.almacenamientoLocalStorage();
  }

  // Seleccionar producto
  seleccionarProducto(producto: any): void {

    this.porcentajes = '';
    this.porcentajeAplicado = false;
    this.cantidad = null;
    this.productoSeleccionado = producto;

    // Se verifica si el producto ya esta cargado
    let cargado = false;
    let productoCargado: any;

    this.productosVenta.map(productoMap => {
      if (productoMap.producto === producto._id) {
        cargado = true;
        productoCargado = productoMap;
      }
    });

    cargado ? this.precio = productoCargado.precio_unitario : this.precio = producto.precio;
    this.productoCargado = cargado;

  }

  // Agregar producto a la venta
  agregarProducto(): void {

    const { _id, descripcion, unidad_medida } = this.productoSeleccionado;

    if (this.cantidad <= 0) {
      this.alertService.info('Debes colocar una cantidad');
      return;
    }

    if (this.precio <= 0) {
      this.alertService.info('Debes colocar un precio');
      return;
    }

    let repetido = false;

    // Se determina si el producto ya esta en la lista
    this.productosVenta.map(producto => {
      if (producto.producto === this.productoSeleccionado._id) {
        producto.cantidad = this.dataService.redondear(producto.cantidad + this.cantidad, 2);
        producto.precio_total = this.dataService.redondear(producto.cantidad * this.precio, 2);
        repetido = true;
      }
    });

    // No esta repetido - Se agrega a la lista
    if (!repetido) {

      const data = {
        producto: _id,
        descripcion,
        familia: this.productoSeleccionado.familia.descripcion,
        unidad_medida: unidad_medida.descripcion,
        precio_unitario: this.precio,
        precio_original: this.precio,
        cantidad: this.cantidad,
        precio_total: this.dataService.redondear(this.precio * this.cantidad, 2),
        creatorUser: this.authService.usuario.userId,
        updatorUser: this.authService.usuario.userId
      }

      this.productosVenta.unshift(data);

      this.filtro.parametroProductos = '';
      this.listarProductos();

    }

    this.productoSeleccionado = null;
    this.cantidad = null;

    this.calcularPrecio();

  }

  // Calcular total
  calcularTotalPagado(): void {

    let totalPagadoTMP = 0;
    let faltaPagar = 0;

    this.formas_pago.map(forma => { totalPagadoTMP += forma.monto; })
    this.cheques.map(cheque => { totalPagadoTMP += cheque.importe; })

    this.totalPagado = totalPagadoTMP;

    // Calculo de monto faltante
    faltaPagar = this.precio_total - this.totalPagado;

    if (faltaPagar > 0) this.forma_pago_monto = faltaPagar;
    else this.forma_pago_monto = null;

    // Calculo de adicion para cuenta corriente
    if (this.precio_total < this.totalPagado) this.incrementoCC = true;
    else this.incrementoCC = false;

  }

  // Actualizar producto
  actualizarProducto(): void {

    const { descripcion, unidad_medida } = this.productoSeleccionado;

    if (this.cantidad <= 0) {
      this.alertService.info('Debes colocar una cantidad');
      return;
    }

    if (this.precio <= 0) {
      this.alertService.info('Debes colocar un precio');
      return;
    }

    this.productosVenta.map((producto) => {
      if (producto.producto === this.productoSeleccionado.producto) {
        producto.cantidad = this.cantidad;
        producto.precio_unitario = this.precio;
        producto.precio_total = this.dataService.redondear(this.cantidad * this.precio, 2);
      }
    });

    this.showEditarProducto = false;
    this.calcularPrecio();

  }

  // Eliminar producto de la venta
  eliminarProductoDeVenta(): void {
    this.alertService.question({ msg: '¿Quieres eliminar el producto?', buttonText: 'Eliminar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.productosVenta = this.productosVenta.filter(elemento => elemento.producto !== this.productoSeleccionado.producto);
          this.showEditarProducto = false;
          this.calcularPrecio();
        }
      });
  }

  // Eliminar cliente seleccionado
  eliminarClienteSeleccionado(): void {
    this.clienteSeleccionado = null;
    this.clientesForm = {
      descripcion: '',
      tipo_identificacion: 'DNI',
      identificacion: '',
      direccion: '',
      telefono: '',
      correo_electronico: '',
      condicion_iva: 'Consumidor Final'
    }
    this.almacenamientoLocalStorage();
  }

  // Eliminar producto seleccionado
  eliminarProducto(): void {
    this.productoSeleccionado = null;
  }

  // Calcular precio
  calcularPrecio(): void {
    let precioTMP = 0;
    this.productosVenta.map(producto => {
      precioTMP += producto.precio_total
    });
    this.precio_total = precioTMP;
    this.almacenamientoLocalStorage();
  }

  // Regresar a etapa anterior
  regresar(etapaActual: string): void {
    if (etapaActual === 'clientes') this.etapa = 'tipo_venta';
    if (etapaActual === 'productos' && this.tipo_cliente === 'cliente') this.etapa = 'cliente';
    if (etapaActual === 'productos' && this.tipo_cliente === 'consumidor_final') this.etapa = 'tipo_venta';
    this.almacenamientoLocalStorage();
  }

  // Seleccionando tipo de cliente
  seleccionarTipoCliente(): void {
    if (this.tipo_cliente === 'consumidor_final') this.etapa = 'productos';
    if (this.tipo_cliente === 'cliente') this.etapa = 'cliente';
    this.almacenamientoLocalStorage();
  }

  // Seleccionar cliente
  seleccionarClienteVenta(): void {
    if (!this.clienteSeleccionado) {
      this.alertService.info('Debes seleccionar un cliente');
      return;
    }
    this.etapa = 'productos';
    this.almacenamientoLocalStorage();
  }

  // Abrir clientes
  abrirModalClientes(): void {
    this.filtro.parametro = '';
    this.paginaActualClientes = 1;
    this.desdeClientes = 0;
    this.cantidadItemsClientes = 10;
    this.listarClientes();
  }

  // Crear venta - DIRECTA
  crearVentaDirecta(): void {

    // Verificacion: Fecha
    if (!this.fecha_venta) {
      this.alertService.info('Debes colocar una fecha válida');
      return;
    }

    // Verificacion: Productos
    if (this.productosVenta.length === 0) {
      this.alertService.info('Debes cargar al menos un producto');
      return;
    }

    // Verificacion: Proveedor
    if (this.proveedor === '') {
      this.alertService.info('Debes seleccionar un proveedor');
      return;
    }

    // Verificacion: Número de factura
    if (this.nro_factura === '') {
      this.alertService.info('Debes colocar un numero de factura');
      return;
    }

    // Creando - VENTA DIRECTA
    this.alertService.question({ msg: '¿Quieres generar la venta?', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {

          this.alertService.loading();

          let dataCliente = '';

          // Adaptando cliente
          if (this.clienteSeleccionado && this.tipo_cliente !== 'consumidor_final') {
            dataCliente = this.clienteSeleccionado._id;
          } else if (!this.clienteSeleccionado && this.tipo_cliente !== 'consumidor_final') {
            dataCliente = '';
          } else if (this.tipo_cliente === 'consumidor_final') {
            dataCliente = '000000000000000000000000'
          }

          const data = {
            cliente: dataCliente,
            nro_factura: this.nro_factura,
            tipo_cliente: this.tipo_cliente,
            tipo_venta: this.tipo_venta,
            fecha_venta: this.fecha_venta,
            cliente_descripcion: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.descripcion : 'CONSUMIDOR FINAL',
            observacion: this.observacion,
            cliente_tipo_identificacion: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.tipo_identificacion : 'DNI',
            cliente_identificacion: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.identificacion : '',
            cliente_direccion: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.direccion : '',
            cliente_telefono: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.telefono : '',
            cliente_correo_electronico: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.correo_electronico : '',
            cliente_condicion_iva: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.condicion_iva : 'Consumidor Final',
            precio_total: this.precio_total,
            productos: this.productosVenta,
            proveedor: this.proveedor,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId,
          };

          this.ventasService.nuevaVenta(data).subscribe({
            next: () => {
              this.reiniciarValores();
              this.alertService.success('Venta generada correctamente');
              window.open(`${base_url}/pdf/venta.pdf`, '_blank');
            },
            error: ({ error }) => this.alertService.errorApi(error.message)
          });

        }
      });
  }

  // Crear venta - PROPIA
  crearVentaPropia(): void {

    // Verificacion: Fecha
    if (!this.fecha_venta) {
      this.alertService.info('Debes colocar una fecha válida');
      return;
    }

    // Verificacion: Productos
    if (this.productosVenta.length === 0) {
      this.alertService.info('Debes cargar al menos un producto');
      return;
    }

    // Verificacion: Formas de pago - Al menos una forma de pago
    if (this.formas_pago.length === 0 && this.cheques.length === 0) {
      this.alertService.info('Debes colocar al menos una forma de pago');
      return;
    }

    // Verificacion: Total pagado
    if (this.precio_total > this.totalPagado) {
      this.alertService.info('Se debe pagar la totalidad de la venta');
      return;
    }

    // Verificacion: Cuenta corriente
    if (this.incrementoCC && (!this.cuenta_corriente || !this.cuenta_corriente?.activo)) {
      this.alertService.info('Se necesita una cuenta corriente para el saldo a favor');
      return;
    }

    // Verificacion: Cliente
    if (!this.clienteSeleccionado) {
      this.alertService.info('Debe seleccionar un cliente');
      return;
    }

    // Creando - VENTA PROPIA 
    this.alertService.question({ msg: '¿Quieres generar la venta?', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {

          this.alertService.loading();

          let dataCliente = '';

          // Adaptando cliente
          if (this.clienteSeleccionado && this.tipo_cliente !== 'consumidor_final') {
            dataCliente = this.clienteSeleccionado._id;
          } else if (!this.clienteSeleccionado && this.tipo_cliente !== 'consumidor_final') {
            dataCliente = '';
          } else if (this.tipo_cliente === 'consumidor_final') {
            dataCliente = '000000000000000000000000'
          }

          const data = {
            cliente: dataCliente,
            tipo_cliente: this.tipo_cliente,
            tipo_venta: this.tipo_venta,
            formas_pago: this.formas_pago,
            cheques: this.cheques,
            cancelada: this.cancelada,
            deuda_monto: this.deuda_monto,
            cliente_descripcion: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.descripcion : 'CONSUMIDOR FINAL',
            observacion: this.observacion,
            cliente_tipo_identificacion: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.tipo_identificacion : 'DNI',
            cliente_identificacion: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.identificacion : '',
            cliente_direccion: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.direccion : '',
            cliente_telefono: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.telefono : '',
            cliente_correo_electronico: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.correo_electronico : '',
            cliente_condicion_iva: this.tipo_cliente !== 'consumidor_final' ? this.clienteSeleccionado.condicion_iva : 'Consumidor Final',
            precio_total: this.precio_total,
            productos: this.productosVenta,
            fecha_venta: this.fecha_venta,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId,
          };

          this.ventasPropiasService.nuevaVenta(data).subscribe({
            next: () => {
              this.reiniciarValores();
              this.showFormaPago = false;
              this.alertService.success('Venta generada correctamente');
              this.authService.getCaja();
              window.open(`${base_url}/pdf/venta-propia.pdf`, '_blank');
            },
            error: ({ error }) => this.alertService.errorApi(error.message)
          });

        }
      });

  }

  // Forma de pago seleccionada
  seleccionandoFormaPago(): void {
    if (this.forma_pago === 'cuenta_corriente') {
      this.montoFijo = true;
      this.forma_pago_monto = this.precio_total
    } else if (this.forma_pago.trim() === '') {
      this.montoFijo = false;
      return;
    } else {
      this.montoFijo = false;
    }
  }

  // Seleccionar banco
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

  // Agregar forma de pago
  agregarFormaPago(): void {

    // Verificacion de forma de pago vacia
    if (this.forma_pago.trim() === '') {
      this.alertService.info('Debe seleccionar una forma de pago');
      return;
    }

    // Verificacion de monto invalido
    if (!this.forma_pago_monto || this.forma_pago_monto < 0) {
      this.alertService.info('Debe colocar un monto válido');
      return;
    }

    // Calculo de deuda
    if (this.forma_pago === 'cuenta_corriente') {
      this.flagCC = true;
      if ((this.cuenta_corriente.saldo < this.forma_pago_monto) && (this.cuenta_corriente.saldo > 0)) {
        this.deuda_monto = this.forma_pago_monto - this.cuenta_corriente.saldo;
        this.cancelada = false;
      } else if (this.cuenta_corriente.saldo <= 0) {
        this.deuda_monto = this.forma_pago_monto;
        this.cancelada = false;
      }
    }

    let existe = false;

    // Si la forma de pago existe
    this.formas_pago.map(forma => {
      if (forma._id === this.forma_pago) {
        existe = true;
        // forma.monto += this.forma_pago_monto;
        // this.forma_pago = '';
        // this.forma_pago_monto = null;
      }
    })

    // La forma de pago ya existe
    if (existe) {
      this.alertService.info('Esa forma de pago ya fue ingresada');
      return; // Si existe se sale de la condicion
    }

    // Impacto en cuenta corriente - CLIENTE
    if (this.forma_pago === 'cuenta_corriente') {
      this.formas_pago.unshift({
        _id: this.forma_pago,
        descripcion: 'CUENTA CORRIENTE',
        monto: this.forma_pago_monto
      })
    }

    // Impacto en caja interna
    else {
      let caja_descripcion = '';
      this.cajas.map(caja => {
        if (caja._id == this.forma_pago) caja_descripcion = caja.descripcion;
      });
      this.formas_pago.unshift({
        _id: this.forma_pago,
        descripcion: caja_descripcion,
        monto: this.forma_pago_monto
      })
    }

    this.calcularTotalPagado();

    this.forma_pago = '';
    // this.forma_pago_monto = null

  }

  // Eliminar forma de pago
  eliminarFormaPago(forma_pago): void {

    // Se reinician los valores de deuda
    if (forma_pago.descripcion === 'CUENTA CORRIENTE') {
      this.flagCC = false;
      this.montoFijo = false;
      this.cancelada = true;
      this.deuda_monto = 0;
    }

    this.formas_pago = this.formas_pago.filter(elemento => elemento._id !== forma_pago._id);

    this.calcularTotalPagado();

  }

  // Eliminar cheque
  eliminarCheque(cheque): void {
    this.cheques = this.cheques.filter(elemento => elemento._id !== cheque._id);
    this.calcularTotalPagado();
  }

  // Forma de pago
  abrirFormaPago(): void {

    this.alertService.loading();

    // Listando cajas
    this.cajasService.listarCajas().subscribe({

      next: ({ cajas }) => {

        this.cajas = cajas.filter(caja => (caja.activo && caja._id !== '222222222222222222222222'));

        if (this.authService.usuario.role !== 'ADMIN_ROLE')
          this.cajas = this.cajas.filter(caja => this.authService.usuario.permisos_cajas.includes(caja._id.toString()))

        // Se buscar el cliente y su cuenta corriente
        this.clientesService.getCliente(this.clienteSeleccionado._id).subscribe({
          next: ({ cliente }) => {

            if (cliente) { // El cliente EXISTE en la BD

              this.datosCliente = cliente;

              // Se busca la cuenta corriente del cliente
              this.ccClientesService.getCuentaCorrientePorCliente(cliente._id).subscribe({

                next: ({ cuenta_corriente }) => {

                  if (cuenta_corriente) {
                    this.cuenta_corriente = cuenta_corriente;
                    this.estadoCuentaCorriente = 'Tiene';

                  } else {
                    this.cuenta_corriente = null;
                    this.estadoCuentaCorriente = 'No tiene';
                  }

                  this.forma_pago = '';
                  this.fecha_venta = format(new Date(), 'yyyy-MM-dd');
                  this.montoFijo = false;
                  this.flagCC = false;
                  this.forma_pago_monto = this.precio_total;
                  this.formas_pago = [];
                  this.showFormaPago = true;
                  this.alertService.close();

                },
                error: ({ error }) => this.alertService.errorApi(error.message)
              })

            } else { // El cliente NO EXISTE en la BD

              this.showFormaPago = true;
              this.estadoCuentaCorriente = 'No existe';
              this.alertService.close();

            }

            this.cheques = [];
            this.incrementoCC = false;
            this.cancelada = true;
            this.deuda_monto = 0;

          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      }, error: ({ error }) => this.alertService.errorApi(error.message)

    })

  }

  // Abrir datos de cheque
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
        this.showFormaPago = false;
        this.showModalCheque = true;
        this.alertService.close();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Agregar cheque
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

    this.calcularTotalPagado();

    this.cerrarModalCheque();

  }

  // Actualizar cheque
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

    this.calcularTotalPagado();

    this.cerrarModalCheque();

  }

  // Cerrar modal cheque
  cerrarModalCheque(): void {
    this.showModalCheque = false;
    this.showFormaPago = true;
  }

  // Editar producto
  abrirEditarProducto(producto): void {
    this.porcentajes = '';
    this.porcentajeAplicado = false;
    this.productoSeleccionado = producto;
    this.showEditarProducto = true;
    this.productoCargado = false;
    this.cantidad = producto.cantidad;
    this.precio = producto.precio_unitario;
  }

  // Reiniciar valores
  reiniciarValores(): void {

    // Clientes
    this.clienteSeleccionado = null;
    this.showOptionsClientes = false;

    // Porcentajes
    this.porcentajesTotal = '';
    this.porcentajeAplicadoTotal = false;

    // Tipo de cliente
    this.tipo_cliente = 'cliente';

    // Flags
    this.etapa = 'tipo_venta';
    this.productoCargado = false;

    // Formulario de cliente
    this.clientesForm = {
      descripcion: '',
      tipo_identificacion: 'DNI',
      identificacion: '',
      direccion: '',
      telefono: '',
      correo_electronico: '',
      condicion_iva: 'Consumidor Final'
    }

    // Venta
    this.fecha_venta = format(new Date(), 'yyyy-MM-dd');
    this.precio_total = 0;
    this.observacion = '';
    this.nro_factura = '';
    this.proveedor = '';

    // Productos
    this.productos = [];
    this.productosVenta = [];
    this.productoSeleccionado = null;
    this.cantidad = null;
    this.precio = null;

    // Formas de pago
    this.formas_pago = [];
    this.forma_pago = '';
    this.forma_pago_monto = null;
    this.cheques = [];

    // Filtrado
    this.filtro = {
      activo: 'true',
      parametro: '',
      parametroProductos: '',
      parametroCliente: ''
    }

    // Ordenar
    this.ordenar = {
      direccion: 1,  // Asc (1) | Desc (-1)
      columna: 'descripcion'
    }

    this.almacenamientoLocalStorage();

  }

  // Crear cuenta corriente
  crearCuentaCorriente(): void {
    this.alertService.question({ msg: 'Creando cuenta corriente para ' + this.datosCliente.descripcion, buttonText: 'Crear' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.ccClientesService.nuevaCuentaCorriente({
            cliente: this.datosCliente._id,
            saldo: 0,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId,
          }).subscribe({
            next: ({ cuenta_corriente }) => {
              this.cuenta_corriente = cuenta_corriente;
              this.estadoCuentaCorriente = 'Tiene';
              this.alertService.success('Cuenta corriente creada');
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });
  }

  // Filtrar Activo/Inactivo
  filtrarActivos(activo: any): void {
    this.paginaActualClientes = 1;
    this.filtro.activo = activo;
  }

  // Filtrar por Parametro
  filtrarParametro(): void {
    this.paginaActualClientes = 1;
  }

  // Ordenar por columna
  ordenarPorColumna(columna: string) {
    this.ordenar.columna = columna;
    this.ordenar.direccion = this.ordenar.direccion == 1 ? -1 : 1;
    this.alertService.loading();
    this.listarClientes();
  }

  // Aplicar variacion porcentual
  aplicarPorcentajes(): void {

    this.precioResguardo = this.precio;

    if (!Number(this.precio)) {
      this.alertService.info('Primero debe colocar un precio');
      return;
    }

    let error = false;
    let precioTMP = this.precio;
    const porcentajesArray = this.porcentajes.trim().split(' ');

    porcentajesArray.map(porcentaje => {

      const signo = porcentaje.charAt(0);

      if (signo === '+') {
        const valor = Number(porcentaje);
        if (!valor) {
          this.alertService.info('Formato incorrecto');
          error = true;
        }
        precioTMP = (1 + (valor / 100)) * precioTMP;

      } else if (signo === '-') {
        const valor = Number(porcentaje);
        if (!valor) {
          this.alertService.info('Formato incorrecto');
          error = true;
        }
        precioTMP = (1 + (valor / 100)) * precioTMP;

      } else {
        this.alertService.info('Formato incorrecto');
        error = true;
      }
    });

    if (!error) {
      this.precio = this.dataService.redondear(precioTMP, 2);
      this.porcentajeAplicado = true;
    }

  }

  // Aplicar porcentajes - Todo los productos
  aplicarPorcentajesTotal(): void {

    let error = false;
    const porcentajesArray = this.porcentajesTotal.trim().split(' ');

    // Verificacion
    porcentajesArray.map(porcentaje => {
      const signo = porcentaje.charAt(0);
      if (signo === '+') {
        const valor = Number(porcentaje);
        if (!valor) error = true;
      } else if (signo === '-') {
        const valor = Number(porcentaje);
        if (!valor) error = true;
      } else {
        error = true;
      }
    });

    if (error) {
      this.alertService.info('Formato incorrecto');
      return;
    }

    this.porcentajeAplicadoTotal = true;

    this.productosVenta.map(producto => {

      let precioTMP = producto.precio_unitario;

      porcentajesArray.map(porcentaje => {
        const valor = Number(porcentaje);
        precioTMP = (1 + (valor / 100)) * precioTMP;
      });

      producto.precio_unitario = this.dataService.redondear(precioTMP, 2);
      producto.precio_total = this.dataService.redondear(precioTMP * producto.cantidad, 2);

    });

    this.calcularPrecio();

  }

  eliminarPorcentajesTotal(): void {
    this.productosVenta.map(producto => {
      producto.precio_unitario = producto.precio_original;
      producto.precio_total = this.dataService.redondear(producto.precio_original * producto.cantidad, 2);
    });
    this.porcentajesTotal = '';
    this.porcentajeAplicadoTotal = false;
    this.calcularPrecio();
  }

  eliminarPorcentaje(): void {
    this.precio = this.precioResguardo;
    this.porcentajes = '';
    this.porcentajeAplicado = false;
  }

  // Seleccion de tipo de venta
  seleccionarTipoVenta(): void {
    if (this.tipo_venta === 'Propia') this.tipo_cliente = 'cliente';
    this.almacenamientoLocalStorage();
  }

  // Abrir modal -> Nuevo cliente
  abrirNuevoCliente(): void {

    // Formulario de cliente
    this.clientesForm = {
      descripcion: '',
      tipo_identificacion: 'DNI',
      identificacion: '',
      direccion: '',
      telefono: '',
      correo_electronico: '',
      condicion_iva: 'Consumidor Final'
    }

    this.showNuevoCliente = true;
    this.showOptionsClientes = false;

  }


  // Crear nuevo cliente
  nuevoCliente(): void {

    // Verificacion: Razon social
    if (!this.clientesForm.descripcion) {
      this.alertService.info('Debe colocar una razón social');
      return;
    }

    // Verificacion: Identificacion
    if (!this.clientesForm.identificacion) {
      this.alertService.info('Debe colocar una identificación');
      return;
    }

    this.alertService.loading();

    const data = {
      ...this.clientesForm,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }
    this.clientesService.nuevoCliente(data).subscribe({
      next: ({ cliente }) => {
        this.clienteSeleccionado = cliente;
        this.showNuevoCliente = false;
        this.almacenamientoLocalStorage();
        this.listarClientes();
        // Listar cliente
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Alamcenamiento en localstorage
  almacenamientoLocalStorage(): void {
    localStorage.setItem('venta_etapa', JSON.stringify(this.etapa));
    localStorage.setItem('venta_productoCargado', JSON.stringify(this.productoCargado));
    localStorage.setItem('venta_porcentajesTotal', JSON.stringify(this.porcentajesTotal));
    localStorage.setItem('venta_porcentajeAplicadoTotal', JSON.stringify(this.porcentajeAplicadoTotal));
    localStorage.setItem('venta_tipo_cliente', JSON.stringify(this.tipo_cliente));
    localStorage.setItem('venta_tipo_venta', JSON.stringify(this.tipo_venta));
    localStorage.setItem('venta_clienteSeleccionado', JSON.stringify(this.clienteSeleccionado));
    localStorage.setItem('venta_clientesForm', JSON.stringify(this.clientesForm));
    localStorage.setItem('venta_productosVenta', JSON.stringify(this.productosVenta));
    localStorage.setItem('venta_precio_total', JSON.stringify(this.precio_total));
    localStorage.setItem('venta_observacion', JSON.stringify(this.observacion));
  }

  // recupearar localstorage
  recuperarLocalStorage(): void {
    this.etapa = localStorage.getItem('venta_etapa') ? JSON.parse(localStorage.getItem('venta_etapa')) : 'tipo_venta';
    this.productoCargado = localStorage.getItem('venta_productoCargado') ? JSON.parse(localStorage.getItem('venta_productoCargado')) : false;
    this.clienteSeleccionado = localStorage.getItem('venta_clienteSeleccionado') ? JSON.parse(localStorage.getItem('venta_clienteSeleccionado')) : null;
    this.porcentajesTotal = localStorage.getItem('venta_porcentajesTotal') ? JSON.parse(localStorage.getItem('venta_porcentajesTotal')) : '';
    this.porcentajeAplicadoTotal = localStorage.getItem('venta_porcentajeAplicadoTotal') ? JSON.parse(localStorage.getItem('venta_porcentajeAplicadoTotal')) : false;
    this.tipo_cliente = localStorage.getItem('venta_tipo_cliente') ? JSON.parse(localStorage.getItem('venta_tipo_cliente')) : 'consumidor_final';
    this.tipo_venta = localStorage.getItem('venta_tipo_venta') ? JSON.parse(localStorage.getItem('venta_tipo_venta')) : 'Directa';
    this.clientesForm = localStorage.getItem('venta_clientesForm') ? JSON.parse(localStorage.getItem('venta_clientesForm')) : {
      descripcion: '',
      tipo_identificacion: 'DNI',
      identificacion: '',
      direccion: '',
      telefono: '',
      correo_electronico: '',
      condicion_iva: 'Consumidor Final'
    };
    this.productosVenta = localStorage.getItem('venta_productosVenta') ? JSON.parse(localStorage.getItem('venta_productosVenta')) : [];
    this.precio_total = localStorage.getItem('venta_precio_total') ? JSON.parse(localStorage.getItem('venta_precio_total')) : [];
    this.observacion = localStorage.getItem('venta_observacion') ? JSON.parse(localStorage.getItem('venta_observacion')) : '';
  }

  // Paginacion - Cambiar pagina
  cambiarPaginaProductos(nroPagina): void {
    this.paginaActualProductos = nroPagina;
    this.desdeProductos = (this.paginaActualProductos - 1) * this.cantidadItemsProductos;
    this.alertService.loading();
    this.listarProductos();
  }

  // Paginacion - Cambiar pagina
  cambiarPaginaClientes(nroPagina): void {
    this.paginaActualClientes = nroPagina;
    this.desdeClientes = (this.paginaActualClientes - 1) * this.cantidadItemsClientes;
    this.alertService.loading();
    this.listarClientes();
  }

  // Cambiar cantidad de items
  cambiarCantidadItems(): void {
    this.paginaActualClientes = 1
    this.cambiarPaginaClientes(1);
  }

}
