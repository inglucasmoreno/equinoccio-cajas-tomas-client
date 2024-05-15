import { Component, OnInit } from '@angular/core';
import gsap from 'gsap';
import { ClientesService } from 'src/app/services/clientes.service';
import { ProductosService } from 'src/app/services/productos.service';
import { AlertService } from '../../services/alert.service';
import { CajasService } from 'src/app/services/cajas.service';
import { format } from 'date-fns';
import { AuthService } from 'src/app/services/auth.service';
import { VentasPropiasService } from 'src/app/services/ventas-propias.service';
import { UnidadMedidaService } from 'src/app/services/unidad-medida.service';
import { FamiliaProductosService } from 'src/app/services/familia-productos.service';

@Component({
  selector: 'app-nueva-venta-simple',
  templateUrl: './nueva-venta-simple.component.html',
  styles: [
  ]
})
export class NuevaVentaSimpleComponent implements OnInit {

  // Modal
  public showModalCliente = false;
  public showModalProducto = false;

  // Listados
  public productos: any[] = [];
  public clientes: any[] = [];
  public cajas: any[] = [];

  // Producto
  public descripcion: string = '';
  public codigoTMP: string = '';

  // Unidades de medida
  public unidades: any[] = [];

  // Famila de productos
  public familias: any[] = [];

  // Elementos seleccionados
  public fecha_venta: string = format(new Date(), 'yyyy-MM-dd');
  public productoSeleccionado: any = '';
  public productosVenta: any[] = [];
  public clienteSeleccionado: any = '';
  public cajaSeleccionada: any = '';
  public monto: number = null;
  public observacion: string = '';

  // Clientes - Form
  public clientesForm: any = {
    descripcion: '',
    tipo_identificacion: 'DNI',
    identificacion: '',
    telefono: '',
    direccion: '',
    correo_electronico: '',
    condicion_iva: 'Consumidor Final'
  }

  // Formulario producto
  public productoForm: any = {
    familia: '',
    codigo: '',
    descripcion: '',
    unidad_medida: '',
    cantidad: null,
    cantidad_minima: null,
    stock_minimo_alerta: 'false',
    precio: null,
  }

  constructor(
    public authService: AuthService,
    private clientesService: ClientesService,
    private productosService: ProductosService,
    private cajasService: CajasService,
    private unidadMedidaService: UnidadMedidaService,
    private familiaProductosService: FamiliaProductosService,
    private ventasPropiasService: VentasPropiasService,
    private alertService: AlertService,
  ) { }

  ngOnInit(): void {

    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.alertService.loading();
    this.cajaSeleccionada = this.authService.caja ? this.authService.caja._id : '';

    // Listado de productos
    this.productosService.listarProductos().subscribe({
      next: ({ productos }) => {
        this.productos = productos.filter(producto => producto.activo);

        // Listado de clientes
        this.clientesService.listarClientes().subscribe({
          next: ({ clientes }) => {
            this.clientes = clientes.filter(cliente => cliente.activo);

            // Listado de cajas
            this.cajasService.listarCajas().subscribe({
              next: ({ cajas }) => {
                this.cajas = cajas.filter(caja => caja.activo && caja._id !== '222222222222222222222222');
                if (this.authService.usuario.role !== 'ADMIN_ROLE')
                  this.cajas = this.cajas.filter(caja => this.authService.usuario.permisos_cajas.includes(caja._id.toString()))
                this.alertService.close();
              }, error: ({ error }) => this.alertService.errorApi(error.message)
            })

          }, error: ({ error }) => this.alertService.errorApi(error.message)
        });
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    });
  }

  // Agregar producto
  agregarProducto() {

    // Verificar que el producto esta seleccionado
    if (!this.productoSeleccionado) {
      this.alertService.info('Debe seleccionar un producto');
      return;
    }

    // Verificar si el producto ya esta cargado en la venta
    let productoCargado = this.productosVenta.find(producto => producto.producto === this.productoSeleccionado);
    if (productoCargado) {
      this.alertService.info('El producto ya esta cargado en la venta');
      return;
    }

    // Agregar producto al arreglo
    let nuevoProducto = this.productos.find(producto => producto._id === this.productoSeleccionado);

    this.productoSeleccionado = '';

    const data = {
      // venta: this.ventaSeleccionada._id,
      producto: nuevoProducto._id,
      descripcion: nuevoProducto.descripcion,
      familia: nuevoProducto.familia.descripcion,
      unidad_medida: nuevoProducto.unidad_medida.descripcion,
      cantidad: 0,
      precio_unitario: 0,
      precio_total: 0,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.productosVenta.push(data);
    this.ordenarProductosVenta();

  }

  // Eliminar producto
  eliminarProducto(producto): void {
    this.productosVenta = this.productosVenta.filter(productoVenta => productoVenta.producto !== producto.producto);
  }

  // Crear venta - PROPIA
  crearVenta(): void {

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

    // Verificar que se haya seleccionado una caja
    if (!this.cajaSeleccionada) {
      this.alertService.info('Debes seleccionar una caja');
      return;
    }


    // Verificar que se haya seleccionado un cliente
    if (!this.clienteSeleccionado) {
      this.alertService.info('Debes seleccionar un cliente');
      return;
    }

    // Verificar que se haya colocado un monto
    if (!this.monto) {
      this.alertService.info('Debes colocar un monto');
      return;
    }

    // Datos de cliente
    let dataCliente = this.clientes.find(cliente => cliente._id === this.clienteSeleccionado);

    // Datos de caja
    let dataCaja = this.cajas.find(caja => caja._id === this.cajaSeleccionada);

    // Creando - VENTA PROPIA
    this.alertService.question({ msg: '¿Quieres generar la venta?', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {

          this.alertService.loading();

          const data = {
            cliente: this.clienteSeleccionado,
            tipo_cliente: 'cliente',
            tipo_venta: 'Propia',
            formas_pago: [{
              _id: dataCaja._id,
              descripcion: dataCaja.descripcion,
              monto: this.monto,
            }],
            cheques: [],
            cancelada: true,
            deuda_monto: 0,
            cliente_descripcion: dataCliente.descripcion,
            observacion: this.observacion.toLocaleUpperCase(),
            cliente_tipo_identificacion: dataCliente.tipo_identificacion,
            cliente_identificacion: dataCliente.identificacion,
            cliente_direccion: dataCliente.direccion,
            cliente_telefono: dataCliente.telefono,
            cliente_correo_electronico: dataCliente.correo_electronico,
            cliente_condicion_iva: dataCliente.condicion_iva,
            precio_total: this.monto,
            productos: this.productosVenta,
            fecha_venta: this.fecha_venta,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId,
          };

          this.ventasPropiasService.nuevaVenta(data).subscribe({
            next: () => {
              this.reiniciarValores();
              this.authService.getCaja();
              this.alertService.success('Venta generada correctamente');
            },
            error: ({ error }) => this.alertService.errorApi(error.message)
          });

        }
      });

  }

  // Abrir modal - Nuevo cliente
  abrirModalCliente(): void {
    this.reiniciarFormularioCliente();
    this.showModalCliente = true;
  }

  // Abrir modal - Nuevo producto
  abrirModalProducto(): void {
    this.alertService.loading();
    this.reiniciarFormularioProducto();
    this.unidadMedidaService.listarUnidades().subscribe({
      next: ({ unidades }) => {
        this.unidades = unidades.filter(unidad => unidad.activo);
        this.familiaProductosService.listarFamilias().subscribe({
          next: ({ familias }) => {
              this.familias = familias.filter(familia => familia.activo);
              this.showModalProducto = true;
              this.alertService.close();
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        });
      }, error: ({ error }) => this.alertService.errorApi(error.messaage)
    });
  }

  // Nuevo cliente
  nuevoCliente(): void {

    const { descripcion, identificacion } = this.clientesForm;

    // Verificacion: Descripción vacia
    if (descripcion.trim() === "") {
      this.alertService.info('Debes colocar una descripción');
      return;
    }

    // Verificacion: Identificacion
    if (identificacion.trim() === "") {
      this.alertService.info('Debes colocar una identificación');
      return;
    }

    this.alertService.loading();

    const data = {
      ...this.clientesForm,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    this.clientesService.nuevoCliente(data).subscribe(({ cliente }) => {
      this.clientes.push(cliente);
      this.ordenarClientes();
      this.clienteSeleccionado = cliente._id;
      this.showModalCliente = false;
      this.alertService.close();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Ordenar productos de la venta
  ordenarProductosVenta(): void {
    this.productosVenta.sort((a, b) => {
      if (a.descripcion > b.descripcion) {
        return 1;
      }
      if (a.descripcion < b.descripcion) {
        return -1;
      }
      return 0;
    });
  }

  // Ordenar productos
  ordenarProductos(): void {
    this.productos.sort((a, b) => {
      if (a.descripcion > b.descripcion) {
        return 1;
      }
      if (a.descripcion < b.descripcion) {
        return -1;
      }
      return 0;
    });
  }

  // Ordenar clientes
  ordenarClientes(): void {
    this.clientes.sort((a, b) => {
      if (a.descripcion > b.descripcion) {
        return 1;
      }
      if (a.descripcion < b.descripcion) {
        return -1;
      }
      return 0;
    });
  }


  // Nuevo producto
  nuevoProducto(): void {

    // Verificacion de código vacio
    if (this.productoForm.codigo.trim() === "") {
      this.alertService.info('Debes colocar un código');
      return;
    }

    // Verificacion: Descripción vacia
    if (this.productoForm.descripcion.trim() === "") {
      this.alertService.info('Debes colocar una descripción');
      return;
    }

    // Verificacion de unidad de medida
    if (!this.productoForm.unidad_medida) {
      this.alertService.info('Debes seleccionar una unidad de medida');
      return;
    }

    // Verificacion de familia de producto
    if (!this.productoForm.familia) {
      this.alertService.info('Debes seleccionar una familia de producto');
      return;
    }

    this.alertService.loading();

    const data = {
      ...this.productoForm,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }

    // Adaptando valores
    data.cantidad = this.productoForm.cantidad ? this.productoForm.cantida : 0;
    data.cantidad_minima = this.productoForm.stock_minimo_alerta === 'true' ? this.productoForm.cantidad_minima : 0;

    this.productosService.nuevoProducto(data).subscribe({
      next: ({ producto }) => {
        this.productos.push(producto);
        this.ordenarProductos();
        this.productoSeleccionado = producto._id;
        this.alertService.close();
        this.showModalProducto = false;
      },
      error: ({ error }) => {
        this.alertService.errorApi(error.message);
      }
    })

  }

  // Reiniciar valores
  reiniciarValores(): void {
    this.productoSeleccionado = '';
    this.productosVenta = [];
    this.clienteSeleccionado = '';
    this.cajaSeleccionada = '';
    this.monto = null;
    this.observacion = '';
  }

  // Reiniciando formulario - Cliente
  reiniciarFormularioCliente(): void {
    this.clientesForm = {
      descripcion: '',
      tipo_identificacion: 'DNI',
      identificacion: '',
      telefono: '',
      direccion: '',
      correo_electronico: '',
      condicion_iva: 'Consumidor Final'
    }
  }

  // Reiniciando formulario - Producto
  reiniciarFormularioProducto(): void {
    this.codigoTMP = '';
    this.productoForm = {
      familia: '',
      codigo: '',
      descripcion: '',
      unidad_medida: '',
      cantidad: null,
      cantidad_minima: null,
      stock_minimo_alerta: 'false',
      precio: null,
    }
  }


}
