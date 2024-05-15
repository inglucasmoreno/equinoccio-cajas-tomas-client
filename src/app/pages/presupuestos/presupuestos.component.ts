import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { format } from 'date-fns';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { PresupuestoProductosService } from 'src/app/services/presupuesto-productos.service';
import { PresupuestosService } from 'src/app/services/presupuestos.service';
import { ProductosService } from 'src/app/services/productos.service';
import { ProveedoresService } from 'src/app/services/proveedores.service';
import { VentasService } from 'src/app/services/ventas.service';
import { environment } from 'src/environments/environment';

const base_url = environment.base_url;

@Component({
  selector: 'app-presupuestos',
  templateUrl: './presupuestos.component.html',
  styles: [
  ]
})
export class PresupuestosComponent implements OnInit {

  // Porcentajes
  public porcentajeAplicado = false;
  public porcentajes = '';
  public porcentajesTotal = '';
  public porcentajeAplicadoTotal = false;
  public precioConPorcentaje = null;

  // Permisos de usuarios login
  public permisos = { all: false };

  // Proveedores
  public proveedores: any[];

  // Modal
  public showModalPresupuesto = false;
  public showModalVenta = false;
  public showModalEditarPresupuesto = false;

  // Presupuesto
  public idPresupuesto: string = '';
  public observacion: string = '';
  public presupuestos: any[] = [];
  public presupuestoSeleccionado: any;
  public descripcion: string = '';

  // Productos
  public productos: any[];
  public productoSeleccionado: any;
  public cantidad = null;
  public precio_unitario = null;
  public precio_total = null;
  public precioResguardo: number = null;

  // Productos - Nuevo producto
  public productoCargado: boolean;
  public showProductos = false;
  public todosProductos: any[];

  // Paginacion
  public totalItems: number;
  public paginaActual: number = 1;
  public cantidadItems: number = 10;
  public desde: number = 0;

  // Estado login
  public observacionActualizadaFlag: boolean = false;
  public productoAgregadoFlag: boolean = false;

  // Venta
  public venta_tipo = 'Propia';

  // Filtrado
  public filtro = {
    activo: 'true',
    parametro: '',
    parametroProductos: ''
  }

  // Ordenar
  public ordenar = {
    direccion: -1,  // Asc (1) | Desc (-1)
    columna: 'createdAt'
  }

  // Paginacion - Productos
  public totalItemsProductos: number;
  public desdeProductos: number = 0;
  public paginaActualProductos: number = 1;
  public cantidadItemsProductos: number = 10;

  constructor(private presupuestosService: PresupuestosService,
    private productosService: ProductosService,
    private ventasService: VentasService,
    private proveedoresService: ProveedoresService,
    private presupuestoProductosService: PresupuestoProductosService,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Listado de presupuestos';
    this.permisos.all = this.permisosUsuarioLogin();
    this.alertService.loading();
    this.cargaInicial();
  }

  cargaInicial(): void {
    // Cargar proveedores
    this.proveedoresService.listarProveedores().subscribe({
      next: ({ proveedores }) => {
        this.proveedores = proveedores;
        this.listarPresupuestos();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)

    });
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('PRESUPUESTOS_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Traer datos de presupuesto
  getPresupuesto(presupuesto: any): void {
    this.alertService.loading();
    this.idPresupuesto = presupuesto._id;
    this.presupuestoSeleccionado = presupuesto;
    this.presupuestosService.getPresupuesto(presupuesto._id).subscribe(({ presupuesto }) => {
      this.descripcion = presupuesto.descripcion;
      this.alertService.close();
      this.showModalPresupuesto = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar presupuestos
  listarPresupuestos(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      desde: this.desde,
      cantidadItems: this.cantidadItems,
      activo: this.filtro.activo,
      parametro: this.filtro.parametro,
    }
    this.presupuestosService.listarPresupuestos(parametros)
      .subscribe(({ presupuestos, totalItems }) => {
        this.presupuestos = presupuestos;
        this.totalItems = totalItems;
        this.showModalPresupuesto = false;
        this.productoSeleccionado = null;

        // Cuando viene de actualizacion de observacion
        if (this.observacionActualizadaFlag) {
          this.alertService.success('Observación actualizada');
          this.observacionActualizadaFlag = false;
        } else if (this.productoAgregadoFlag) {
          this.productoAgregadoFlag = false;
          this.listarProductos();
        } else this.alertService.close();

      }, (({ error }) => {
        this.alertService.errorApi(error.msg);
      }));
  }

  // Nuevo presupuesto
  nuevoPresupuesto(): void {

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

    this.presupuestosService.nuevoPresupuesto(data).subscribe(() => {
      this.listarPresupuestos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar presupuesto
  actualizarPresupuesto(): void {

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

    this.presupuestosService.actualizarPresupuesto(this.idPresupuesto, data).subscribe(() => {
      this.listarPresupuestos();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(presupuesto: any): void {

    const { _id, activo } = presupuesto;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: '¿Quieres actualizar el estado?', buttonText: 'Actualizar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.presupuestosService.actualizarPresupuesto(_id, { activo: !activo }).subscribe(() => {
            this.alertService.loading();
            this.listarPresupuestos();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });

  }

  // Obtener datos de presupuesto
  obtenerPresupuesto(presupuesto: any): void {

    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      presupuesto: presupuesto._id
    }

    this.alertService.loading();

    this.presupuestoProductosService.listarProductos(parametros).subscribe({
      next: ({ productos }) => {
        this.productos = productos;
        this.presupuestoSeleccionado = presupuesto;
        this.showModalPresupuesto = true;
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Generar PDF
  generarPDF(presupuesto: any): void {
    this.alertService.loading();
    this.presupuestosService.generarPDF({ presupuesto: presupuesto._id }).subscribe({
      next: () => {
        window.open(`${base_url}/pdf/presupuesto.pdf`, '_blank');
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Abrir editar presupuesto
  abrirEditarPresupuesto(presupuesto: any): void {

    this.presupuestoSeleccionado = presupuesto;
    this.precioConPorcentaje = null;
    this.porcentajeAplicadoTotal = false;
    this.porcentajesTotal = '';
    this.productoSeleccionado = null;
    this.observacion = presupuesto.observacion;

    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      presupuesto: presupuesto._id
    }

    this.alertService.loading();

    this.presupuestoProductosService.listarProductos(parametros).subscribe({
      next: ({ productos }) => {

        this.productos = productos;

        // Se le agregan los precios de reguardo
        this.productos.map(producto => {
          producto.precio_unitario_resguardo = producto.precio_unitario;
          producto.precio_total_resguardo = producto.precio_total;
        });

        this.presupuestoSeleccionado = presupuesto;
        this.showModalEditarPresupuesto = true;
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Actualizar observacion
  actualizarObservacion(): void {
    this.alertService.loading();
    const data = {
      observacion: this.observacion,
      updatorUser: this.authService.usuario.userId
    };
    this.presupuestosService.actualizarPresupuesto(this.presupuestoSeleccionado._id, data).subscribe(() => {
      this.observacionActualizadaFlag = true;
      this.listarPresupuestos();
    });
  }

  // Seleccionar producto - Para actualizar
  seleccionarProducto(producto): void {

    if (this.porcentajeAplicadoTotal) {
      this.alertService.info('Debe completar la modificación por porcentajes');
      return;
    }

    this.porcentajes = '';
    this.porcentajeAplicado = false;
    this.productoSeleccionado = producto;
    this.cantidad = producto.cantidad;
    this.precio_unitario = producto.precio_unitario;
  }

  // Actualizar producto
  actualizarProducto(): void {

    if (!this.cantidad || this.cantidad < 0) {
      this.alertService.info('Debe colocar una cantidad válida');
      return;
    }

    if (!this.precio_unitario || this.precio_unitario < 0) {
      this.alertService.info('Debe colocar un precio válido');
      return;
    }

    const data = {
      cantidad: this.cantidad,
      precio_unitario: this.precio_unitario,
      precio_total: this.dataService.redondear(this.cantidad * this.precio_unitario, 2),
      updatorUser: this.authService.usuario.userId
    };

    this.alertService.loading();

    // Se actualiza el producto
    this.presupuestoProductosService.actualizarProducto(this.productoSeleccionado._id, data).subscribe({
      next: () => {
        let precio_total_presupuesto = 0;
        this.productos.map(producto => {
          if (this.productoSeleccionado._id === producto._id) {
            producto.cantidad = data.cantidad;
            producto.precio_unitario = data.precio_unitario;
            producto.precio_total = data.precio_total
          }
          precio_total_presupuesto += producto.precio_total;
        })
        this.presupuestoSeleccionado.precio_total = precio_total_presupuesto;

        // Se actualiza el precio total del presupuesto
        this.presupuestosService.actualizarPresupuesto(this.presupuestoSeleccionado._id, { precio_total: precio_total_presupuesto }).subscribe({
          next: () => this.listarPresupuestos(),
          error: ({ error }) => this.alertService.errorApi(error.message)
        })
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Eliminar producto
  eliminarProducto(): void {
    this.alertService.question({ msg: '¿Quieres eliminar el producto?', buttonText: 'Eliminar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.presupuestoProductosService.eliminarProducto(this.productoSeleccionado._id).subscribe({
            next: () => {

              // Se filtra el producto
              this.productos = this.productos.filter(producto => producto._id !== this.productoSeleccionado._id);

              // Se calcula el precio total
              let precio_total_presupuesto = 0;
              this.productos.map(producto => precio_total_presupuesto += producto.precio_total);
              this.presupuestoSeleccionado.precio_total = precio_total_presupuesto;

              // Se actualiza el precio total del presupuesto
              this.presupuestosService.actualizarPresupuesto(this.presupuestoSeleccionado._id, { precio_total: precio_total_presupuesto }).subscribe({
                next: () => this.listarPresupuestos(),
                error: ({ error }) => this.alertService.errorApi(error.message)
              })

            },
            error: ({ error }) => this.alertService.errorApi(error.message)
          })
        }
      });


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
        this.todosProductos = productos;
        this.alertService.close();
        this.showModalEditarPresupuesto = false;
        this.showProductos = true;
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  // Agregar producto
  agregarProducto(): void {

    this.filtro.parametroProductos = '';

    // Verificacion: Cantidad valida
    if (!this.cantidad || this.cantidad < 0) {
      this.alertService.info('Debe ingresar una cantidad válida');
      return;
    }

    // Verificacion: Precio valido
    if (!this.precio_unitario || this.precio_unitario < 0) {
      this.alertService.info('Debe ingresar un precio válido');
      return;
    }

    let repetido = false;
    let idRepetido: string;

    this.productos.map(producto => {
      if (producto.producto === this.productoSeleccionado._id) {
        repetido = true;
        idRepetido = producto._id
      };
    });

    this.alertService.loading();

    if (repetido) {

      const data = {
        presupuesto: this.presupuestoSeleccionado,
        cantidad: this.cantidad,
        precio_unitario: this.precio_unitario,
        precio_total: this.dataService.redondear(this.precio_unitario * this.cantidad, 2),
      }

      this.presupuestoProductosService.actualizarProducto(idRepetido, data).subscribe({
        next: ({ productos }) => {

          this.productos = productos;

          // Se calcula el precio total
          let precio_total_presupuesto = 0;
          this.productos.map(producto => precio_total_presupuesto += producto.precio_total);
          this.presupuestoSeleccionado.precio_total = precio_total_presupuesto;

          // Se actualiza el precio total del presupuesto
          this.presupuestosService.actualizarPresupuesto(this.presupuestoSeleccionado._id, { precio_total: precio_total_presupuesto }).subscribe({
            next: () => {
              this.productoAgregadoFlag = true;
              this.listarPresupuestos();
            },
            error: ({ error }) => this.alertService.errorApi(error.message)
          })

        },
        error: ({ error }) => this.alertService.errorApi(error.message)
      })

    } else {

      const data = {
        presupuesto: this.presupuestoSeleccionado._id,
        producto: this.productoSeleccionado._id,
        descripcion: this.productoSeleccionado.descripcion,
        familia: this.productoSeleccionado.familia.descripcion,
        unidad_medida: this.productoSeleccionado.unidad_medida.descripcion,
        cantidad: this.cantidad,
        precio_unitario: this.precio_unitario,
        precio_total: this.dataService.redondear(this.precio_unitario * this.cantidad, 2),
        creatorUser: this.authService.usuario.userId,
        updatorUser: this.authService.usuario.userId,
      }

      this.presupuestoProductosService.nuevoProducto(data).subscribe({

        next: ({ productos }) => {
          // this.filtro.parametroProductos = '';
          this.productos = productos;

          // Se calcula el precio total
          let precio_total_presupuesto = 0;
          this.productos.map(producto => precio_total_presupuesto += producto.precio_total);
          this.presupuestoSeleccionado.precio_total = precio_total_presupuesto;

          // Se actualiza el precio total del presupuesto
          this.presupuestosService.actualizarPresupuesto(this.presupuestoSeleccionado._id, { precio_total: precio_total_presupuesto }).subscribe({
            next: () => {
              this.productoAgregadoFlag = true;
              this.listarPresupuestos();
            },
            error: ({ error }) => this.alertService.errorApi(error.message)
          })

        },
        error: ({ error }) => this.alertService.errorApi(error.message)
      });

    }

  }

  // Abrir generar venta
  abrirGenerarVenta(presupuesto: any): void {
    this.venta_tipo = 'Propia';
    this.presupuestoSeleccionado = presupuesto;
    this.showModalVenta = true;
    this.showModalEditarPresupuesto = false;
  }

  generarVenta(): void {

    this.alertService.loading();

    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      presupuesto: this.presupuestoSeleccionado._id
    }

    this.presupuestoProductosService.listarProductos(parametros).subscribe({
      next: ({ productos }) => {

        let productosVenta = [];
        let precioTotal = 0;

        productos.map( producto => {
          productosVenta.push({
            cantidad: producto.cantidad,
            creatorUser: this.authService.usuario.userId,
            descripcion: producto.descripcion,
            familia: producto.familia,
            precio_original: producto.precio_unitario,
            precio_total: producto.precio_total,
            precio_unitario: producto.precio_unitario,
            producto: producto.producto,
            unidad_medida: producto.unidad_medida,
            updatorUser: this.authService.usuario.userId,
          })
          precioTotal += producto.precio_total;
        })

        // Adaptacion de localstorage

        localStorage.setItem('venta_productosVenta', JSON.stringify(productosVenta));
        localStorage.setItem('venta_tipo_venta', JSON.stringify(this.venta_tipo));
        localStorage.setItem('venta_clienteSeleccionado', JSON.stringify(this.presupuestoSeleccionado.cliente));
        localStorage.setItem('venta_porcentajesTotal', "");
        localStorage.setItem('venta_porcentajeAplicadoTotal', JSON.stringify(false));
        localStorage.setItem('venta_precio_total', JSON.stringify(precioTotal));
        
        if(this.presupuestoSeleccionado.cliente._id === '000000000000000000000000'){
          if(this.venta_tipo === 'Directa'){
            localStorage.setItem('venta_etapa', JSON.stringify("productos"));
            localStorage.setItem('venta_tipo_cliente', JSON.stringify("consumidor_final"));
            localStorage.setItem('venta_clienteSeleccionado', JSON.stringify("consumidor_final"));
          }else{
            localStorage.setItem('venta_etapa', JSON.stringify("cliente"));
            localStorage.setItem('venta_tipo_cliente', JSON.stringify("cliente"));
            localStorage.setItem('venta_clienteSeleccionado', JSON.stringify(null));
          }
        }else{
          localStorage.setItem('venta_etapa', JSON.stringify("cliente"));
          localStorage.setItem('venta_tipo_cliente', JSON.stringify("cliente"));
        }

        this.router.navigateByUrl('/dashboard/nueva-venta');

        this.alertService.close();
      
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Seleccionar producto
  seleccionarProductoNuevo(producto: any): void {

    this.porcentajes = '';
    this.porcentajeAplicado = false;
    this.cantidad = null;
    this.productoSeleccionado = producto;

    // Se verifica si el producto ya esta cargado
    let cargado = false;
    let productoCargado: any;

    this.productos.map(productoMap => {
      if (productoMap.producto === producto._id) {
        cargado = true;
        productoCargado = productoMap;
      }
    });

    cargado ? this.precio_unitario = productoCargado.precio_unitario : this.precio_unitario = producto.precio;
    this.productoCargado = cargado;

  }

  // Listado de productos -> Editar producto
  volverEditar(): void {
    this.productoSeleccionado = null;
    this.showProductos = false;
    this.showModalEditarPresupuesto = true;
  }

  buscarProductos(): void {

    if (this.porcentajeAplicadoTotal) {
      this.alertService.info('Debe completar la modificación por porcentajes');
      return;
    }

    this.productoSeleccionado = null;
    this.cantidad = null;
    this.filtro.parametroProductos = '';
    this.cantidadItemsProductos = 10;
    this.listarProductos();

  }

  // Aplicar variacion porcentual
  aplicarPorcentajes(): void {

    this.precioResguardo = this.precio_unitario;

    if (!Number(this.precio_unitario)) {
      this.alertService.info('Primero debe colocar un precio');
      return;
    }

    let error = false;
    let precioTMP = this.precio_unitario;
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
      this.precio_unitario = this.dataService.redondear(precioTMP, 2);
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

    this.productos.map(producto => {

      let precioTMP = producto.precio_unitario;

      porcentajesArray.map(porcentaje => {
        const valor = Number(porcentaje);
        precioTMP = (1 + (valor / 100)) * precioTMP;
      });

      producto.precio_unitario = this.dataService.redondear(precioTMP, 2);
      producto.precio_total = this.dataService.redondear(precioTMP * producto.cantidad, 2);

    });

    this.calcularPrecioPorcentaje();

  }

  // Eliminar porcentajes
  eliminarPorcentajesTotal(): void {
    this.productos.map(producto => {
      producto.precio_unitario = producto.precio_unitario_resguardo;
      producto.precio_total = producto.precio_total_resguardo;
    });
    this.porcentajesTotal = '';
    this.porcentajeAplicadoTotal = false;
    this.precioConPorcentaje = null;
  }

  // Eliminar porcentaje
  eliminarPorcentaje(): void {
    this.precio_unitario = this.precioResguardo;
    this.porcentajes = '';
    this.porcentajeAplicado = false;
  }

  // Calcular nuevo precio con porcentaje aplicado
  calcularPrecioPorcentaje(): void {
    let precioTMP = 0;
    this.productos.map(producto => {
      precioTMP += producto.precio_total;
    });
    this.precioConPorcentaje = this.dataService.redondear(precioTMP, 2);;
  }

  // Actualizar productos con porcentajes
  actualizarProductosConPorcentajes(): void {
    this.alertService.loading();

    let data = [];

    this.productos.map(producto => {
      data.push({
        _id: producto._id,
        presupuesto: producto.presupuesto,
        precio_unitario: producto.precio_unitario,
        precio_total: producto.precio_total,
        updatorUser: this.authService.usuario.userId,
      })
    });

    this.presupuestoProductosService.actualizarProductos(data).subscribe({
      next: () => {
        this.porcentajesTotal = '';
        this.presupuestoSeleccionado.precio_total = this.precioConPorcentaje;
        this.porcentajeAplicadoTotal = false;
        this.precioConPorcentaje = null;
        this.alertService.success('Actualizacion correcta');
      },
      error: ({ error }) => this.alertService.errorApi(error)
    })
  }

  // Reiniciando formulario
  reiniciarFormulario(): void {
    this.descripcion = '';
  }

  // Filtrar Activo/Inactivo
  filtrarActivos(activo: any): void {
    this.paginaActualProductos = 1;
    this.filtro.activo = activo;
  }

  // Filtrar por Parametro
  filtrarParametro(parametro: string): void {
    this.paginaActualProductos = 1;
    this.filtro.parametro = parametro;
  }

  // Ordenar por columna
  ordenarPorColumna(columna: string) {
    this.ordenar.columna = columna;
    this.ordenar.direccion = this.ordenar.direccion == 1 ? -1 : 1;
    this.alertService.loading();
    this.listarPresupuestos();
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
    this.listarPresupuestos();
  }

  // Paginacion - Cambiar pagina - Productos
  cambiarPaginaProductos(nroPagina): void {
    this.paginaActualProductos = nroPagina;
    this.desdeProductos = (this.paginaActualProductos - 1) * this.cantidadItemsProductos;
    this.alertService.loading();
    this.listarProductos();
  }

}
