import { Component, OnInit } from '@angular/core';
import { format } from 'date-fns';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { CajasService } from 'src/app/services/cajas.service';
import { CcProveedoresService } from 'src/app/services/cc-proveedores.service';
import { ChequesService } from 'src/app/services/cheques.service';
import { ComprasService } from 'src/app/services/compras.service';
import { DataService } from 'src/app/services/data.service';
import { ProductosService } from 'src/app/services/productos.service';
import { ProveedoresService } from 'src/app/services/proveedores.service';
import gsap from 'gsap';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Component({
  selector: 'app-nueva-compra',
  templateUrl: './nueva-compra.component.html',
  styles: [
  ]
})
export class NuevaCompraComponent implements OnInit {

  // Flag
  public showProductos: boolean = false;
  public showOptions: boolean = false;
  public productoCargado = false;
  public showEditarProducto = false;
  public showCompletarCompra = false;
  public showCheques = false;
  public flagCC = false;
  public montoFijo = false;

  // Cuenta corriente - Proveedor
  public estadoCuentaCorriente: string = 'No tiene'; // Tiene | No tiene | No exite
  public datosCliente: any = null;
  public cuenta_corriente: any = null;

  // Cajas
  public cajas: any[] = [];

  // Porcentajes
  public showNuevoProveedor = false;
  public porcentajeAplicado = false;
  public porcentajes = '';
  public porcentajeAplicadoTotal = false;
  public porcentajesTotal = '';

  // Productos
  public productos: any[] = [];
  public productosCompra: any[] = [];
  public productoSeleccionado: any = null;
  public cantidad: number = null;
  public precio: number = null;
  public precioResguardo: number = null;

  // Etapas
  public etapa = 'proveedores';

  // Compra
  public precio_total = 0;
  public observacion: string = '';
  public nro_factura: string = '';
  public fecha_compra = '';
  public forma_pago: string = '';
  public forma_pago_monto: number = null;
  public formas_pago: any[] = [];
  public cheques: any[] = [];
  public cancelada: boolean = true;
  public totalPagado: number = 0;
  public deuda_monto: number = 0;
  public incrementoCC: boolean = false;

  // Cheques
  public falgInicioCheques: boolean = true;
  public listaCheques: any[] = [];
  public totalCheques: number = 0;
  public totalTmpCheques: number = 0;

  // FORM - PROVEEDORES
  proveedoresForm = {
    descripcion: '',
    tipo_identificacion: 'DNI',
    identificacion: '',
    telefono: '',
    correo_electronico: '',
    direccion: '',
    condicion_iva: 'Consumidor Final',
  }

  // Proveedores
  public proveedorSeleccionado: any = null;
  public proveedores: any[] = [];

  // Paginacion - Productos
  public totalItems: number;
  public desde: number = 0;
  public paginaActualProductos: number = 1;
  public cantidadItemsProductos: number = 10;

  // Filtrado
  public filtro = {
    activo: 'true',
    parametroProductos: '',
    parametroProveedor: ''
  }

  constructor(
    private dataService: DataService,
    private cajasService: CajasService,
    private chequesService: ChequesService,
    public authService: AuthService,
    private alertService: AlertService,
    private comprasService: ComprasService,
    private proveedoresService: ProveedoresService,
    private ccProveedoresService: CcProveedoresService,
    private productosService: ProductosService
  ) { }

  ngOnInit(): void {
    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.dataService.ubicacionActual = 'Dashboard - Compras';
    this.alertService.loading();
    this.recuperarLocalStorage();
    this.listarProveedores();
  }

  // Calculos iniciales de la seccion
  listarProveedores(): void {
    this.proveedoresService.listarProveedores().subscribe({
      next: ({ proveedores }) => {
        this.proveedores = proveedores.filter(proveedor => proveedor.activo);
        this.alertService.close();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Completar compra
  completarCompra(): void {

    // Verificaciones - Pago total
    if (this.precio_total > this.totalPagado) {
      this.alertService.info('El monto pagado no puede ser menor al precio total');
      return;
    }

    // Verificaciones - Número de factura
    if (this.nro_factura.trim() === '') {
      this.alertService.info('Debe colocar un número de factura');
      return;
    }

    // Verificcion - Cuenta corriente cuando hay saldo a favor
    if (this.estadoCuentaCorriente === 'No tiene' && (this.totalPagado - this.precio_total) > 0) {
      this.alertService.info('Tienes saldo a favor pero no tienes una cuenta corriente creada en este proveedor.');
      return;
    }

    this.alertService.question({ msg: 'Completando compra', buttonText: 'Completar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {

          this.alertService.loading();

          const data = {
            proveedor: this.proveedorSeleccionado._id,
            observacion: this.observacion,
            fecha_compra: this.fecha_compra,
            nro_factura: this.nro_factura,
            monto_deuda: this.deuda_monto,
            monto_pago: this.totalPagado,
            precio_total: this.precio_total,
            formas_pago: this.formas_pago,
            cheques: this.cheques,
            productos: this.productosCompra,
            cancelada: this.deuda_monto > 0 ? false : true,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId,
          };

          this.comprasService.nuevaCompra(data).subscribe({
            next: () => {
              this.etapa = 'proveedores';
              this.showOptions = false;
              this.filtro.parametroProveedor = '';
              this.nro_factura = '';
              this.proveedorSeleccionado = null;
              this.porcentajes = '';
              this.porcentajesTotal = '';
              this.productosCompra = [];
              this.porcentajeAplicado = false;
              this.porcentajeAplicadoTotal = false;
              this.observacion = '';
              this.showCompletarCompra = false;
              this.almacenamientoLocalStorage();
              window.open(`${base_url}/pdf/compra.pdf`, '_blank');
              this.alertService.close();
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });
  }

  // Cambiar etapa
  cambiarEtapa(proximaEtapa: string): void {

    if (proximaEtapa === 'proveedores') { // compra -> proveedores



    } else if (proximaEtapa === 'compra') { // proveedores -> compra

      if (!this.proveedorSeleccionado) {
        this.alertService.info('Debe seleccionar un proveedor');
        return;
      }

      // Se selecciona el proveedor
      this.proveedorSeleccionado = this.proveedores.find(proveedor => proveedor._id === this.proveedorSeleccionado._id);

    }

    this.etapa = proximaEtapa;

    this.almacenamientoLocalStorage();

  }

  // Listar productos
  listarProductos(): void {
    this.alertService.loading();
    this.productosService.listarProductos({
      desde: this.desde,
      cantidadItems: this.cantidadItemsProductos,
      parametro: this.filtro.parametroProductos,
      activo: true
    }).subscribe({
      next: ({ productos, totalItems }) => {
        this.totalItems = totalItems;
        this.productos = productos;
        this.showProductos = true;
        this.almacenamientoLocalStorage();
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Forma de pago
  abrirCompletarCompra(): void {

    this.alertService.loading();

    this.falgInicioCheques = true;
    this.cheques = [];
    this.listaCheques = [];

    // Listando cajas
    this.cajasService.listarCajas().subscribe({

      next: ({ cajas }) => {

        this.cajas = cajas.filter(caja => (caja.activo && caja._id !== '222222222222222222222222'));

        if (this.authService.usuario.role !== 'ADMIN_ROLE')
        this.cajas = this.cajas.filter(caja => this.authService.usuario.permisos_cajas.includes(caja._id.toString()))

        this.ccProveedoresService.getCuentaCorrientePorProveedor(this.proveedorSeleccionado._id).subscribe({
          next: ({ cuenta_corriente }) => {

            if (cuenta_corriente) {
              this.cuenta_corriente = cuenta_corriente;
              this.estadoCuentaCorriente = 'Tiene';

            } else {
              this.cuenta_corriente = null;
              this.estadoCuentaCorriente = 'No tiene';
            }

            this.forma_pago = '';
            this.fecha_compra = format(new Date(), 'yyyy-MM-dd');
            this.montoFijo = false;
            this.flagCC = false;
            this.forma_pago_monto = this.precio_total;
            this.formas_pago = [];
            this.showCompletarCompra = true;
            this.alertService.close();

          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      }, error: ({ error }) => this.alertService.errorApi(error.message)

    })

  }

  // Agregar producto a la compra
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
    this.productosCompra.map(producto => {
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

      this.productosCompra.unshift(data);

      this.filtro.parametroProductos = '';
      this.listarProductos();

    }

    this.productoSeleccionado = null;
    this.cantidad = null;

    this.calcularPrecio();

  }

  // Seleccionar producto
  seleccionarProducto(producto: any): void {

    this.cantidad = null;
    this.porcentajeAplicado = false;
    this.porcentajes = '';
    this.productoSeleccionado = producto;

    // Se verifica si el producto ya esta cargado
    let cargado = false;
    let productoCargado: any;

    this.productosCompra.map(productoMap => {
      if (productoMap.producto === producto._id) {
        cargado = true;
        productoCargado = productoMap;
      }
    });

    // cargado ? this.precio = productoCargado.precio_unitario : this.precio = producto.precio;
    cargado ? this.precio = productoCargado.precio_unitario : this.precio = null;
    this.productoCargado = cargado;

    this.almacenamientoLocalStorage();

  }

  buscarProductos(): void {
    this.productoSeleccionado = null;
    this.cantidad = null;
    this.filtro.parametroProductos = '';
    this.cantidadItemsProductos = 10;
    this.listarProductos();
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

  eliminarPorcentajesTotal(): void {
    this.productosCompra.map(producto => {
      producto.precio_unitario = producto.precio_original;
      producto.precio_total = this.dataService.redondear(producto.precio_original * producto.cantidad, 2);
    });
    this.porcentajesTotal = '';
    this.porcentajeAplicadoTotal = false;
    this.calcularPrecio();
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

    this.productosCompra.map(producto => {

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

    this.productosCompra.map((producto) => {
      if (producto.producto === this.productoSeleccionado.producto) {
        producto.cantidad = this.cantidad;
        producto.precio_unitario = this.precio;
        producto.precio_total = this.dataService.redondear(this.cantidad * this.precio, 2);
      }
    });

    this.showEditarProducto = false;
    this.calcularPrecio();

  }


  // Calcular precio
  calcularPrecio(): void {
    let precioTMP = 0;
    this.productosCompra.map(producto => {
      precioTMP += producto.precio_total
    });
    this.precio_total = precioTMP;
    this.almacenamientoLocalStorage();
  }

  eliminarPorcentaje(): void {
    this.precio = this.precioResguardo;
    this.porcentajes = '';
    this.porcentajeAplicado = false;
  }

  // Eliminar producto seleccionado
  eliminarProducto(): void {
    this.productoSeleccionado = null;
  }

  // Eliminar producto de la compra
  eliminarProductoDeCompra(): void {
    this.alertService.question({ msg: '¿Quieres eliminar el producto?', buttonText: 'Eliminar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.productosCompra = this.productosCompra.filter(elemento => elemento.producto !== this.productoSeleccionado.producto);
          this.showEditarProducto = false;
          this.calcularPrecio();
        }
      });
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

    let excesoMonto = '';

    // Verificacion de exceso de monto
    this.cajas.map(caja => {
      if (caja._id === this.forma_pago && caja.saldo < this.forma_pago_monto) excesoMonto = caja.descripcion;
    });

    if (excesoMonto.trim() !== '') {
      this.alertService.info(`No tienes suficiente saldo en la caja ${excesoMonto}`);
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

  // Editar producto
  abrirEditarProducto(producto): void {
    this.porcentajeAplicado = false;
    this.porcentajes = '';
    this.productoSeleccionado = producto;
    this.showEditarProducto = true;
    this.productoCargado = false;
    this.cantidad = producto.cantidad;
    this.precio = producto.precio_unitario;
  }

  // Crear cuenta corriente
  crearCuentaCorriente(): void {
    this.alertService.question({ msg: 'Creando cuenta corriente en ' + this.proveedorSeleccionado?.descripcion, buttonText: 'Crear' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.ccProveedoresService.nuevaCuentaCorriente({
            proveedor: this.proveedorSeleccionado._id,
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

    this.almacenamientoLocalStorage();

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
          this.showCompletarCompra = false;
          this.falgInicioCheques = false;
          this.showCheques = true;
          this.alertService.close();
        }, error: ({ error }) => this.alertService.errorApi(error.message)
      })
    } else {
      this.showCompletarCompra = false;
      this.falgInicioCheques = false;
      this.showCheques = true;
    }
  }

  // Cerrar listado de cheques
  cerrarListaCheques(): void {
    this.showCompletarCompra = true;
    this.showCheques = false;
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
    this.calcularTotalPagado();
    this.showCheques = false;
    this.showCompletarCompra = true;
  }

  // Eliminar cheque
  eliminarCheque(cheque): void {
    this.cheques = this.cheques.filter(elemento => elemento._id !== cheque._id);
    this.listaCheques.map(elemento => elemento._id === cheque._id ? elemento.seleccionado = false : null);
    this.calcularTotalPagado();
  }

  // Calcular total en cheques
  calcularTotalEnCheques(): void {
    this.totalTmpCheques = 0;
    this.listaCheques.map(cheque => {
      cheque.seleccionado ? this.totalTmpCheques += cheque.importe : null;
    });
  }

  seleccionarProveedor(proveedor: any): void {
    this.proveedorSeleccionado = proveedor;
    this.almacenamientoLocalStorage();
  }

  // Abrir modal -> Nuevo proveedor
  abrirNuevoProveedor(): void {

    // Formulario de proveedor
    this.proveedoresForm = {
      descripcion: '',
      tipo_identificacion: 'DNI',
      identificacion: '',
      telefono: '',
      correo_electronico: '',
      direccion: '',
      condicion_iva: 'Consumidor Final',
    }

    this.showNuevoProveedor = true;
    this.showOptions = false;

  }

  // Borrar proveedor
  borrarProveedor(): void {
    this.proveedorSeleccionado = null;
    this.filtro.parametroProveedor = '';
  }

  // Nuevo proveedor
  nuevoProveedor(): void {

    // Verificacion: Razon social
    if (!this.proveedoresForm.descripcion) {
      this.alertService.info('Debe colocar una razón social');
      return;
    }

    this.alertService.loading();
    const data = {
      ...this.proveedoresForm,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    };
    this.proveedoresService.nuevoProveedor(data).subscribe({
      next: ({ proveedor }) => {
        this.proveedorSeleccionado = proveedor;
        this.showNuevoProveedor = false;
        this.listarProveedores();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Paginacion - Cambiar pagina
  cambiarPagina(nroPagina): void {
    this.paginaActualProductos = nroPagina;
    this.desde = (this.paginaActualProductos - 1) * this.cantidadItemsProductos;
    this.alertService.loading();
    this.listarProductos();
  }

  // Alamcenamiento en localstorage
  almacenamientoLocalStorage(): void {
    localStorage.setItem('compra-etapa', JSON.stringify(this.etapa));
    localStorage.setItem('compra-porcentajesTotal', JSON.stringify(this.porcentajesTotal));
    localStorage.setItem('compra-porcentajeAplicadoTotal', JSON.stringify(this.porcentajeAplicadoTotal));
    localStorage.setItem('compra-productoCargado', JSON.stringify(this.productoCargado));
    localStorage.setItem('compra-proveedorSeleccionado', JSON.stringify(this.proveedorSeleccionado));
    localStorage.setItem('compra-productosCompra', JSON.stringify(this.productosCompra));
    localStorage.setItem('compra-precio_total', JSON.stringify(this.precio_total));
    localStorage.setItem('compra-observacion', JSON.stringify(this.observacion));
  }

  // recupearar localstorage
  recuperarLocalStorage(): void {
    this.etapa = localStorage.getItem('compra-etapa') ? JSON.parse(localStorage.getItem('compra-etapa')) : 'proveedores';
    this.porcentajesTotal = localStorage.getItem('compra-porcentajesTotal') ? JSON.parse(localStorage.getItem('compra-porcentajesTotal')) : '';
    this.porcentajeAplicadoTotal = localStorage.getItem('compra-porcentajeAplicadoTotal') ? JSON.parse(localStorage.getItem('compra-porcentajeAplicadoTotal')) : false;
    this.productoCargado = localStorage.getItem('compra-productoCargado') ? JSON.parse(localStorage.getItem('compra-productoCargado')) : false;
    this.proveedorSeleccionado = localStorage.getItem('compra-proveedorSeleccionado') ? JSON.parse(localStorage.getItem('compra-proveedorSeleccionado')) : null;
    this.productosCompra = localStorage.getItem('compra-productosCompra') ? JSON.parse(localStorage.getItem('compra-productosCompra')) : [];
    this.precio_total = localStorage.getItem('compra-precio_total') ? JSON.parse(localStorage.getItem('compra-precio_total')) : [];
    this.observacion = localStorage.getItem('compra-observacion') ? JSON.parse(localStorage.getItem('compra-observacion')) : '';
  }

}
