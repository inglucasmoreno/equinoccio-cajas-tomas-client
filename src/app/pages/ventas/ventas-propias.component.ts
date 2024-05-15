import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { format } from 'date-fns';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { ProductosService } from 'src/app/services/productos.service';
import { RecibosCobroVentaService } from 'src/app/services/recibos-cobro-venta.service';
import { ReportesService } from 'src/app/services/reportes.service';
import { VentasPropiasChequesService } from 'src/app/services/ventas-propias-cheques.service';
import { VentasPropiasProductosService } from 'src/app/services/ventas-propias-productos.service';
import { VentasPropiasService } from 'src/app/services/ventas-propias.service';
import { environment } from 'src/environments/environment';
import { saveAs } from 'file-saver-es';

const base_url = environment.base_url;

@Component({
  selector: 'app-ventas-propias',
  templateUrl: './ventas-propias.component.html',
  styleUrls: []
})
export class VentasPropiasComponent implements OnInit {

  // Flags
  public textoCompleto: boolean = false;

  // Compra
  public showModalCompra = false;

  // Reportes
  public reportes = {
    fechaDesde: '',
    fechaHasta: '',
    activas: 'true'
  };

  // Porcentajes
  public porcentajeAplicado = false;
  public porcentajes = '';
  public porcentajesTotal = '';
  public porcentajeAplicadoTotal = false;
  public precioConPorcentaje = null;

  // Permisos de usuarios login
  public permisos = { all: false };

  // Modal
  public showModalVenta = false;
  public showModalEditarVenta = false;
  public showModalReportesVentas = false;

  // Cheques
  public showDetallesCheque = false;
  public chequeSeleccionado: any;

  // Venta
  public idVenta: string = '';
  public observacion: string = '';
  public ventas: any[] = [];
  public ventaSeleccionada: any;
  public descripcion: string = '';
  public pagoTotal: number = 0;

  // Relacion -> CHEQUES - VENTAS
  public cheques_venta = [];

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

  // Recibos de cobro
  public recibosCobro: any[] = [];

  // Estado login
  public observacionActualizadaFlag: boolean = false;
  public productoAgregadoFlag: boolean = false;

  // Filtrado
  public filtro = {
    activo: 'true',
    cancelada: '',
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

  // Paginacion - Presupuestos
  public totalItems: number;
  public desde: number = 0;
  public paginaActual: number = 1;
  public cantidadItems: number = 10;

  constructor(private ventasPropiasService: VentasPropiasService,
    private recibosCobroVentaService: RecibosCobroVentaService,
    private ventasPropiasChequesService: VentasPropiasChequesService,
    private productosService: ProductosService,
    private reportesService: ReportesService,
    private ventasPropiasProductosService: VentasPropiasProductosService,
    public authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Ventas propias';
    this.alertService.loading();
    this.activatedRoute.params.subscribe(({ codigo }) => {
      if (codigo) this.filtro.parametro = codigo;
      this.permisos.all = this.permisosUsuarioLogin();
      this.listarVentas();
    });
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('VENTAS_PROPIAS_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Traer datos de ventas
  getVenta(venta: any): void {
    this.alertService.loading();
    this.idVenta = venta._id;
    this.ventaSeleccionada = venta;
    this.ventasPropiasService.getVenta(venta._id).subscribe(({ venta }) => {
      this.descripcion = venta.descripcion;
      this.alertService.close();
      this.showModalVenta = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar ventas
  listarVentas(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      desde: this.desde,
      cantidadItems: this.cantidadItems,
      activo: this.filtro.activo,
      parametro: this.filtro.parametro,
      cancelada: this.filtro.cancelada,
    }
    this.ventasPropiasService.listarVentas(parametros)
      .subscribe(({ ventas, totalItems }) => {

        this.ventas = ventas;
        this.totalItems = totalItems;
        this.showModalVenta = false;
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

  // Nueva venta
  nuevaVenta(): void {

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

    this.ventasPropiasService.nuevaVenta(data).subscribe(() => {
      this.listarVentas();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar venta
  actualizarVenta(): void {

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

    this.ventasPropiasService.actualizarVenta(this.idVenta, data).subscribe(() => {
      this.listarVentas();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(venta: any): void {

    const { _id, activo } = venta;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: venta.activo ? '¿Quieres dar de baja la venta?' : '¿Quieres dar de alta la venta?', buttonText: venta.activo ? 'Dar de baja' : 'Data de alta' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          const estado = activo ? 'Baja' : 'Alta';
          this.ventasPropiasService.altaBajaVenta(_id, {
            estado,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId
          }).subscribe(() => {
            this.alertService.loading();
            this.listarVentas();
            this.authService.getCaja();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });
  }

  // Obtener datos de venta
  obtenerVenta(venta: any): void {

    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      venta: venta._id
    }

    this.alertService.loading();

    this.ventasPropiasProductosService.listarProductos(parametros).subscribe({
      next: ({ productos }) => {
        this.productos = productos;
        window.scroll(0, 0);
        this.ventaSeleccionada = venta;
        this.showModalVenta = true;
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Calculo de pago total
  calcularPagoTotal(): void {

    let pagoTotalTMP = 0;

    // Sumando montos de formas de pago
    this.ventaSeleccionada.formas_pago.map(forma => {
      pagoTotalTMP += forma.monto;
    });

    // Sumando montos de cheques
    this.cheques_venta.map(relacion => {
      pagoTotalTMP += relacion.cheque.importe;
    });

    this.pagoTotal = pagoTotalTMP;

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

  // Abrir detalles de cheque
  abrirDetallesCheque(cheque: any): void {
    this.chequeSeleccionado = cheque;
    this.showModalVenta = false;
    this.showModalEditarVenta = false;
    this.showDetallesCheque = true;
  }

  // Cerrar detalles de cheque
  cerrarDetallesCheque(): void {
    this.showDetallesCheque = false;
    this.showModalEditarVenta = true;
  }

  // Abrir editar venta
  abrirEditarVenta(venta: any): void {

    this.ventaSeleccionada = venta;
    this.productoSeleccionado = null;
    this.filtro.parametroProductos = '';
    this.observacion = venta.observacion;

    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      venta: venta._id
    }

    this.alertService.loading();

    this.ventasPropiasProductosService.listarProductos(parametros).subscribe({
      next: ({ productos }) => {

        this.productos = productos;

        // Se le agregan los precios de reguardo
        this.productos.map(producto => {
          producto.precio_unitario_resguardo = producto.precio_unitario;
          producto.precio_total_resguardo = producto.precio_total;
        });

        // Se obtienen los cheques relacionados con la venta
        this.ventasPropiasChequesService.listarRelaciones({ venta_propia: venta._id }).subscribe({
          next: ({ relaciones }) => {
            this.cheques_venta = relaciones;

            // Se obtienen los recibos de cobro
            this.recibosCobroVentaService.listarRelaciones({ venta_propia: venta._id }).subscribe({
              next: ({ relaciones }) => {

                this.recibosCobro = relaciones;

                window.scroll(0, 0);
                this.calcularPagoTotal();
                this.showModalEditarVenta = true;
                this.alertService.close();
              }, error: ({ error }) => this.alertService.errorApi(error.message)
            })

          },
          error: ({ error }) => this.alertService.errorApi(error.message)
        })
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
    this.ventasPropiasService.actualizarVenta(this.ventaSeleccionada._id, data).subscribe(() => {
      this.observacionActualizadaFlag = true;
      this.listarVentas();
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
    this.ventasPropiasProductosService.actualizarProducto(this.productoSeleccionado._id, data).subscribe({
      next: () => {
        let precio_total_venta = 0;
        this.productos.map(producto => {
          if (this.productoSeleccionado._id === producto._id) {
            producto.cantidad = data.cantidad;
            producto.precio_unitario = data.precio_unitario;
            producto.precio_total = data.precio_total
          }
          precio_total_venta += producto.precio_total;
        })
        this.ventaSeleccionada.precio_total = precio_total_venta;

        // Se actualiza el precio total de la venta
        this.ventasPropiasService.actualizarVenta(this.ventaSeleccionada._id, { precio_total: precio_total_venta }).subscribe({
          next: () => this.listarVentas(),
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
          this.ventasPropiasProductosService.eliminarProducto(this.productoSeleccionado._id).subscribe({
            next: () => {

              // Se filtra el producto
              this.productos = this.productos.filter(producto => producto._id !== this.productoSeleccionado._id);

              // Se calcula el precio total
              let precio_total_venta = 0;
              this.productos.map(producto => precio_total_venta += producto.precio_total);
              this.ventaSeleccionada.precio_total = precio_total_venta;

              // Se actualiza el precio total de la venta
              this.ventasPropiasService.actualizarVenta(this.ventaSeleccionada._id, { precio_total: precio_total_venta }).subscribe({
                next: () => this.listarVentas(),
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
      cantidadItems: this.cantidadItems,
      parametro: this.filtro.parametroProductos,
      activo: true
    }).subscribe({
      next: ({ productos, totalItems }) => {
        this.totalItemsProductos = totalItems;
        this.todosProductos = productos;
        this.alertService.close();
        this.showModalEditarVenta = false;
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
        venta: this.ventaSeleccionada,
        cantidad: this.cantidad,
        precio_unitario: this.precio_unitario,
        precio_total: this.dataService.redondear(this.precio_unitario * this.cantidad, 2),
      }

      this.ventasPropiasProductosService.actualizarProducto(idRepetido, data).subscribe({
        next: ({ productos }) => {

          this.productos = productos;

          // Se calcula el precio total
          let precio_total_venta = 0;
          this.productos.map(producto => precio_total_venta += producto.precio_total);
          this.ventaSeleccionada.precio_total = precio_total_venta;

          // Se actualiza el precio total de la venta
          this.ventasPropiasService.actualizarVenta(this.ventaSeleccionada._id, { precio_total: precio_total_venta }).subscribe({
            next: () => {
              this.productoAgregadoFlag = true;
              this.listarVentas();
            },
            error: ({ error }) => this.alertService.errorApi(error.message)
          })

        },
        error: ({ error }) => this.alertService.errorApi(error.message)
      })

    } else {

      const data = {
        venta: this.ventaSeleccionada._id,
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

      this.ventasPropiasProductosService.nuevoProducto(data).subscribe({

        next: ({ productos }) => {
          // this.filtro.parametroProductos = '';
          this.productos = productos;

          // Se calcula el precio total
          let precio_total_venta = 0;
          this.productos.map(producto => precio_total_venta += producto.precio_total);
          this.ventaSeleccionada.precio_total = precio_total_venta;

          // Se actualiza el precio total de la venta
          this.ventasPropiasService.actualizarVenta(this.ventaSeleccionada._id, { precio_total: precio_total_venta }).subscribe({
            next: () => {
              this.productoAgregadoFlag = true;
              this.listarVentas();
            },
            error: ({ error }) => this.alertService.errorApi(error.message)
          })

        },
        error: ({ error }) => this.alertService.errorApi(error.message)
      });

    }

  }

  // Seleccionar producto
  seleccionarProductoNuevo(producto: any): void {

    this.porcentajeAplicado = false;
    this.porcentajes = '';
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
    this.showModalEditarVenta = true;
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

  // Actualizar productos con porcentajes
  actualizarProductosConPorcentajes(): void {
    this.alertService.loading();

    let data = [];

    this.productos.map(producto => {
      data.push({
        _id: producto._id,
        venta: producto.venta,
        precio_unitario: producto.precio_unitario,
        precio_total: producto.precio_total,
        updatorUser: this.authService.usuario.userId,
      })
    });

    this.ventasPropiasProductosService.actualizarProductos(data).subscribe({
      next: () => {
        this.porcentajesTotal = '';
        this.ventaSeleccionada.precio_total = this.precioConPorcentaje;
        this.porcentajeAplicadoTotal = false;
        this.precioConPorcentaje = null;
        this.alertService.success('Actualizacion correcta');
      },
      error: ({ error }) => this.alertService.errorApi(error)
    })
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

  // Reporte - Excel
  reporteExcel(): void {
    this.alertService.question({ msg: 'Generando reporte', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.reportesService.ventasPropiasExcel(this.reportes).subscribe({
            next: (buffer) => {
              const blob = new Blob([buffer.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              saveAs(blob, `Reporte - Ventas propias - ${format(new Date(), 'dd-MM-yyyy')}`);
              this.showModalReportesVentas = false;
              this.alertService.close();
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          });
        }
      });
  }

  // Abrir generar compra
  abrirGenerarCompra(venta: any): void {
    this.ventaSeleccionada = venta;
    this.showModalCompra = true;
    this.showModalEditarVenta = false;
  }

  generarCompra(): void {

    this.alertService.loading();

    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      venta: this.ventaSeleccionada._id
    }

    this.ventasPropiasProductosService.listarProductos(parametros).subscribe({
      next: ({ productos }) => {

        let productosCompra = [];
        let precioTotal = 0;

        productos.map(producto => {
          productosCompra.push({
            cantidad: producto.cantidad,
            creatorUser: this.authService.usuario.userId,
            descripcion: producto.descripcion,
            familia: producto.familia,
            precio_original: producto.precio_unitario,
            precio_total: producto.precio_total,
            precio_unitario: producto.precio_unitario,
            producto: producto.producto._id,
            unidad_medida: producto.unidad_medida,
            updatorUser: this.authService.usuario.userId,
          })
          precioTotal += producto.precio_total;
        })

        // Adaptacion de localstorage

        localStorage.setItem('compra-productosCompra', JSON.stringify(productosCompra));
        localStorage.setItem('compra-porcentajesTotal', "");
        localStorage.setItem('compra-porcentajeAplicadoTotal', JSON.stringify(false));
        localStorage.setItem('compra-precio_total', JSON.stringify(precioTotal));
        localStorage.setItem('compra-proveedorSeleccionado', JSON.stringify(null));
        localStorage.setItem('compra-etapa', JSON.stringify("proveedores"));

        this.router.navigateByUrl('/dashboard/nueva-compra');

        this.alertService.close();

      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }


  // Abrir reportes - Excel
  abrirReportes(): void {
    this.reportes.fechaDesde = '';
    this.reportes.fechaHasta = '';
    this.showModalReportesVentas = true;
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
    this.listarVentas();
  }

  // Paginacion - Cambiar pagina
  cambiarPaginaProductos(nroPagina): void {
    this.paginaActualProductos = nroPagina;
    this.desdeProductos = (this.paginaActualProductos - 1) * this.cantidadItemsProductos;
    this.alertService.loading();
    this.listarProductos();
  }

  // Paginacion - Cambiar pagina
  cambiarPagina(nroPagina): void {
    this.paginaActual = nroPagina;
    this.desde = (this.paginaActual - 1) * this.cantidadItems;
    this.alertService.loading();
    this.listarVentas();
  }

  // Cambiar cantidad de items
  cambiarCantidadItems(): void {
    this.paginaActual = 1
    this.cambiarPagina(1);
  }

}
