import { Component, OnInit } from '@angular/core';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { ClientesService } from 'src/app/services/clientes.service';
import { DataService } from 'src/app/services/data.service';
import { ProductosService } from 'src/app/services/productos.service';
import gsap from 'gsap';
import { PresupuestosService } from 'src/app/services/presupuestos.service';
import { environment } from 'src/environments/environment';
import { ProveedoresService } from '../../services/proveedores.service';

const base_url = environment.base_url;

@Component({
  selector: 'app-nuevo-presupuesto',
  templateUrl: './nuevo-presupuesto.component.html',
  styles: [
  ]
})
export class NuevoPresupuestoComponent implements OnInit {

  // Flags
  public showOptionsClientes = false;

  // Porcentajes
  public porcentajeAplicado = false;
  public porcentajes = '';
  public porcentajeAplicadoTotal = false;
  public porcentajesTotal = '';

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showClientes = false;
  public showProductos = false;
  public showEditarProducto = false;
  public showNuevoCliente = false;

  // Clientes
  public clientes: any[] = [];
  public clienteSeleccionado: any = null;

  // Proveedores
  public proveedores: any[] = [];

  // Tipo de presupuesto
  public tipo_presupuesto = 'consumidor_final';

  // Flags
  public etapa = 'tipo_presupuesto';
  public productoCargado = false;

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

  // Presupuesto
  public precio_total = 0;
  public observacion: string = '';

  // Productos
  public productos: any[] = [];
  public productosPresupuesto: any[] = [];
  public productoSeleccionado: any = null;
  public cantidad: number = null;
  public precio: number = null;
  public precioResguardo: number = null;

  // Paginacion - Clientes
  public paginaActual: number = 1;
  public cantidadItems: number = 10;

  // Paginacion - Productos
  public totalItems: number;
  public desde: number = 0;
  public paginaActualProductos: number = 1;
  public cantidadItemsProductos: number = 10;

  // Paginacion - Clientes
  public totalItemsClientes: number;
  public desdeClientes: number = 0;
  public paginaActualClientes: number = 1;
  public cantidadItemsClientes: number = 10;

  // Filtrado
  public filtro = {
    activo: 'true',
    parametroCliente: '',
    parametroProductos: ''
  }

  // Ordenar
  public ordenar = {
    direccion: 1,  // Asc (1) | Desc (-1)
    columna: 'descripcion'
  }

  constructor(private clientesService: ClientesService,
    private authService: AuthService,
    private proveedoresService: ProveedoresService,
    private presupuestosService: PresupuestosService,
    private productosService: ProductosService,
    private alertService: AlertService,
    private dataService: DataService) { }

  ngOnInit(): void {
    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.dataService.ubicacionActual = 'Dashboard - Nuevo presupuesto';
    this.recuperarLocalStorage();
    this.alertService.loading();
    this.proveedoresService.listarProveedores().subscribe({
      next: ({ proveedores }) => {
        this.proveedores = proveedores;
        this.listarClientes();
        // this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    });
  }

  // Listar clientes
  listarClientes(): void {
    this.clientesService.listarClientes({
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      activo: true
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
      desde: this.desde,
      cantidadItems: this.cantidadItems,
      parametro: this.filtro.parametroProductos,
      activo: true
    }).subscribe({
      next: ({ productos, totalItems }) => {
        this.totalItems = totalItems;
        this.productos = productos;
        this.alertService.close();
        this.showProductos = true;
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

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

  // Seleccionar producto
  seleccionarProducto(producto: any): void {

    this.cantidad = null;
    this.porcentajeAplicado = false;
    this.porcentajes = '';
    this.productoSeleccionado = producto;

    // Se verifica si el producto ya esta cargado
    let cargado = false;
    let productoCargado: any;

    this.productosPresupuesto.map(productoMap => {
      if (productoMap.producto === producto._id) {
        cargado = true;
        productoCargado = productoMap;
      }
    });

    cargado ? this.precio = productoCargado.precio_unitario : this.precio = producto.precio;
    this.productoCargado = cargado;

  }

  // Agregar producto al presupuesto
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
    this.productosPresupuesto.map(producto => {
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

      this.productosPresupuesto.unshift(data);

      this.filtro.parametroProductos = '';
      this.listarProductos();

    }

    this.productoSeleccionado = null;
    this.cantidad = null;

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

    this.productosPresupuesto.map((producto) => {
      if (producto.producto === this.productoSeleccionado.producto) {
        producto.cantidad = this.cantidad;
        producto.precio_unitario = this.precio;
        producto.precio_total = this.dataService.redondear(this.cantidad * this.precio, 2);
      }
    });

    this.showEditarProducto = false;
    this.calcularPrecio();

  }

  // Eliminar producto de presupuestoh
  eliminarProductoDePresupuesto(): void {
    this.alertService.question({ msg: '¿Quieres eliminar el producto?', buttonText: 'Eliminar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.productosPresupuesto = this.productosPresupuesto.filter(elemento => elemento.producto !== this.productoSeleccionado.producto);
          this.showEditarProducto = false;
          this.calcularPrecio();
        }
      });
  }

  // Eliminar producto seleccionado
  eliminarProducto(): void {
    this.productoSeleccionado = null;
  }

  // Calcular precio
  calcularPrecio(): void {
    let precioTMP = 0;
    this.productosPresupuesto.map(producto => {
      precioTMP += producto.precio_total
    });
    this.precio_total = precioTMP;
    this.almacenamientoLocalStorage();
  }

  // Regresar a etapa anterior
  regresar(etapaActual: string): void {
    if (etapaActual === 'clientes') this.etapa = 'tipo_presupuesto';
    if (etapaActual === 'productos' && this.tipo_presupuesto === 'cliente') this.etapa = 'cliente';
    if (etapaActual === 'productos' && this.tipo_presupuesto === 'consumidor_final') this.etapa = 'tipo_presupuesto';
    this.almacenamientoLocalStorage();
  }

  // Seleccionando tipo de presupuesto
  seleccionarTipoPresupuesto(): void {
    if (this.tipo_presupuesto === 'consumidor_final') this.etapa = 'productos';
    if (this.tipo_presupuesto === 'cliente') this.etapa = 'cliente';
    this.almacenamientoLocalStorage();
  }

  // Seleccionar cliente
  seleccionarClientePresupuesto(): void {

    if (!this.clienteSeleccionado) {
      this.alertService.info('Debes seleccionar un cliente');
      return;
    }

    this.etapa = 'productos';
    this.almacenamientoLocalStorage();
  }

  // Abrir clientes
  abrirModalClientes(): void {
    this.filtro.parametroCliente = '';
    this.paginaActualClientes = 1;
    this.desdeClientes = 0;
    this.cantidadItemsClientes = 10;
    this.listarClientes();
  }

  // Crear presupuesto
  crearPresupuesto(): void {

    // Verificacion: Productos
    if (this.productosPresupuesto.length === 0) {
      this.alertService.info('Debes cargar al menos un producto');
      return;
    }

    this.alertService.question({ msg: '¿Quieres generar el presupuesto?', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {

          this.alertService.loading();

          let dataCliente = '';

          // Adaptando cliente
          if (this.clienteSeleccionado && this.tipo_presupuesto !== 'consumidor_final') {
            dataCliente = this.clienteSeleccionado._id;
          } else if (!this.clienteSeleccionado && this.tipo_presupuesto !== 'consumidor_final') {
            dataCliente = '';
          } else if (this.tipo_presupuesto === 'consumidor_final') {
            dataCliente = '000000000000000000000000'
          }

          const data = {
            cliente: dataCliente,
            tipo_presupuesto: this.tipo_presupuesto,
            descripcion: this.tipo_presupuesto !== 'consumidor_final' ? this.clienteSeleccionado.descripcion : 'CONSUMIDOR FINAL',
            observacion: this.observacion,
            tipo_identificacion: this.tipo_presupuesto !== 'consumidor_final' ? this.clienteSeleccionado.tipo_identificacion : 'DNI',
            identificacion: this.tipo_presupuesto !== 'consumidor_final' ? this.clienteSeleccionado.identificacion : '',
            direccion: this.tipo_presupuesto !== 'consumidor_final' ? this.clienteSeleccionado.direccion : '',
            telefono: this.tipo_presupuesto !== 'consumidor_final' ? this.clienteSeleccionado.telefono : '',
            correo_electronico: this.tipo_presupuesto !== 'consumidor_final' ? this.clienteSeleccionado.correo_electronico : '',
            condicion_iva: this.tipo_presupuesto !== 'consumidor_final' ? this.clienteSeleccionado.condicion_iva : 'Consumidor Final',
            precio_total: this.precio_total,
            productos: this.productosPresupuesto,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId,
          };

          this.presupuestosService.nuevoPresupuesto(data).subscribe({
            next: () => {
              this.reiniciarValores();
              this.alertService.success('Presupuesto generado correctamente');
              window.open(`${base_url}/pdf/presupuesto.pdf`, '_blank');
            },
            error: ({ error }) => this.alertService.errorApi(error.message)
          });

        }
      });
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

  reiniciarValores(): void {

    // Clientes
    this.showOptionsClientes = false;
    this.clienteSeleccionado = null;

    // Porcentajes
    this.porcentajesTotal = '';
    this.porcentajeAplicadoTotal = false;

    // Tipo de presupuesto
    this.tipo_presupuesto = 'consumidor_final';

    // Flags
    this.etapa = 'tipo_presupuesto';
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

    // Presupuesto
    this.precio_total = 0;
    this.observacion = '';

    // Productos
    this.productos = [];
    this.productosPresupuesto = [];
    this.productoSeleccionado = null;
    this.cantidad = null;
    this.precio = null;

    // Filtrado
    this.filtro = {
      activo: 'true',
      parametroCliente: '',
      parametroProductos: ''
    }

    // Ordenar
    this.ordenar = {
      direccion: 1,  // Asc (1) | Desc (-1)
      columna: 'descripcion'
    }

    this.almacenamientoLocalStorage();

  }

  // Filtrar Activo/Inactivo
  filtrarActivos(activo: any): void {
    this.paginaActual = 1;
    this.filtro.activo = activo;
  }

  // Filtrar por Parametro
  filtrarParametro(): void {
    this.paginaActual = 1;
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

    this.productosPresupuesto.map(producto => {

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
    this.productosPresupuesto.map(producto => {
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

  // Alamcenamiento en localstorage
  almacenamientoLocalStorage(): void {
    localStorage.setItem('presupuestos-etapa', JSON.stringify(this.etapa));
    localStorage.setItem('presupuestos-porcentajesTotal', JSON.stringify(this.porcentajesTotal));
    localStorage.setItem('presupuestos-porcentajeAplicadoTotal', JSON.stringify(this.porcentajeAplicadoTotal));
    localStorage.setItem('presupuestos-productoCargado', JSON.stringify(this.productoCargado));
    localStorage.setItem('presupuestos-tipo_presupuesto', JSON.stringify(this.tipo_presupuesto));
    localStorage.setItem('presupuestos-clienteSeleccionado', JSON.stringify(this.clienteSeleccionado));
    localStorage.setItem('presupuestos-clientesForm', JSON.stringify(this.clientesForm));
    localStorage.setItem('presupuestos-productosPresupuesto', JSON.stringify(this.productosPresupuesto));
    localStorage.setItem('presupuestos-precio_total', JSON.stringify(this.precio_total));
    localStorage.setItem('presupuestos-observacion', JSON.stringify(this.observacion));
  }

  // recupearar localstorage
  recuperarLocalStorage(): void {
    this.etapa = localStorage.getItem('presupuestos-etapa') ? JSON.parse(localStorage.getItem('presupuestos-etapa')) : 'tipo_presupuesto';
    this.porcentajesTotal = localStorage.getItem('presupuestos-porcentajesTotal') ? JSON.parse(localStorage.getItem('presupuestos-porcentajesTotal')) : '';
    this.porcentajeAplicadoTotal = localStorage.getItem('presupuestos-porcentajeAplicadoTotal') ? JSON.parse(localStorage.getItem('presupuestos-porcentajeAplicadoTotal')) : false;
    this.etapa = localStorage.getItem('presupuestos-etapa') ? JSON.parse(localStorage.getItem('presupuestos-etapa')) : 'tipo_presupuesto';
    this.productoCargado = localStorage.getItem('presupuestos-productoCargado') ? JSON.parse(localStorage.getItem('presupuestos-productoCargado')) : false;
    this.clienteSeleccionado = localStorage.getItem('presupuestos-clienteSeleccionado') ? JSON.parse(localStorage.getItem('presupuestos-clienteSeleccionado')) : null;
    this.tipo_presupuesto = localStorage.getItem('presupuestos-tipo_presupuesto') ? JSON.parse(localStorage.getItem('presupuestos-tipo_presupuesto')) : 'consumidor_final';
    this.clientesForm = localStorage.getItem('presupuestos-clientesForm') ? JSON.parse(localStorage.getItem('presupuestos-clientesForm')) : {
      descripcion: '',
      tipo_identificacion: 'DNI',
      identificacion: '',
      direccion: '',
      telefono: '',
      correo_electronico: '',
      condicion_iva: 'Consumidor Final'
    };
    this.productosPresupuesto = localStorage.getItem('presupuestos-productosPresupuesto') ? JSON.parse(localStorage.getItem('presupuestos-productosPresupuesto')) : [];
    this.precio_total = localStorage.getItem('presupuestos-precio_total') ? JSON.parse(localStorage.getItem('presupuestos-precio_total')) : [];
    this.observacion = localStorage.getItem('presupuestos-observacion') ? JSON.parse(localStorage.getItem('presupuestos-observacion')) : '';
  }

  // Cambiar cantidad de items - Clientes
  cambiarCantidadItemsClientes(): void {
    this.paginaActualClientes = 1
    this.cambiarPaginaClientes(1);
  }

  // Paginacion - Cambiar pagina - Clientes
  cambiarPaginaClientes(nroPagina): void {
    this.paginaActualClientes = nroPagina;
    this.desdeClientes = (this.paginaActualClientes - 1) * this.cantidadItemsClientes;
    this.alertService.loading();
    this.listarClientes();
  }

  // Paginacion - Cambiar pagina
  cambiarPagina(nroPagina): void {
    this.paginaActualProductos = nroPagina;
    this.desde = (this.paginaActualProductos - 1) * this.cantidadItemsProductos;
    this.alertService.loading();
    this.listarProductos();
  }

}
