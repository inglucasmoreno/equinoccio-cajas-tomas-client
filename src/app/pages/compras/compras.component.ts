import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { ComprasChequesService } from 'src/app/services/compras-cheques.service';
import { ComprasProductosService } from 'src/app/services/compras-productos.service';
import { ComprasService } from 'src/app/services/compras.service';
import { DataService } from 'src/app/services/data.service';
import { OrdenesPagoCompraService } from 'src/app/services/ordenes-pago-compra.service';
import { ProductosService } from 'src/app/services/productos.service';
import { ReportesService } from 'src/app/services/reportes.service';
import { environment } from 'src/environments/environment';
import { saveAs } from 'file-saver-es'; 
import { format } from 'date-fns';

const base_url = environment.base_url;

@Component({
  selector: 'app-compras',
  templateUrl: './compras.component.html',
  styles: [
  ]
})
export class ComprasComponent implements OnInit {

  // Ventas
  public venta_tipo = 'Propia';
  public showModalVenta = false;

  // Fechas
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
  public showModalCompra = false;
  public showModalEditarCompra = false;
  public showModalReportesCompra = false;

  // Cheques
  public showDetallesCheque = false;
  public chequeSeleccionado: any;

  // Compra
  public idCompra: string = '';
  public observacion: string = '';
  public compras: any[] = [];
  public compraSeleccionada: any;
  public descripcion: string = '';
  public pagoTotal: number = 0;

  // Relacion -> CHEQUES - COMPRAS
  public cheques_compra = [];

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

  // Ordenes de pago
  public ordenesPago: any[] = [];

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

  constructor(private comprasService: ComprasService,
    //  private recibosCobroVentaService: RecibosCobroVentaService,
    private comprasChequesService: ComprasChequesService,
    private productosService: ProductosService,
    private comprasProductosService: ComprasProductosService,
    private ordenesPagoCompraService: OrdenesPagoCompraService,
    public authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private alertService: AlertService,
    private dataService: DataService,
    private router: Router,
    private reportesService: ReportesService
    ) { }

  ngOnInit(): void {
    this.dataService.ubicacionActual = 'Dashboard - Compras';
    this.alertService.loading();
    this.activatedRoute.params.subscribe(({ codigo }) => {
      if (codigo) this.filtro.parametro = codigo;
      this.permisos.all = this.permisosUsuarioLogin();
      this.listarCompras();
    })
  }

  // Asignar permisos de usuario login
  permisosUsuarioLogin(): boolean {
    return this.authService.usuario.permisos.includes('COMPRAS_ALL') || this.authService.usuario.role === 'ADMIN_ROLE';
  }

  // Traer datos de compra
  getCompra(compra: any): void {
    this.alertService.loading();
    this.idCompra = compra._id;
    this.compraSeleccionada = compra;
    this.comprasService.getCompra(compra._id).subscribe(({ compra }) => {
      this.descripcion = compra.descripcion;
      this.alertService.close();
      this.showModalCompra = true;
    }, ({ error }) => {
      this.alertService.errorApi(error);
    });
  }

  // Listar compras
  listarCompras(): void {
    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      desde: this.desde,
      cantidadItems: this.cantidadItems,
      activo: this.filtro.activo,
      parametro: this.filtro.parametro,
      cancelada: this.filtro.cancelada,
    }
    this.comprasService.listarCompras(parametros)
      .subscribe(({ compras, totalItems }) => {

        this.compras = compras;
        this.totalItems = totalItems;
        this.showModalCompra = false;
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

  // Nueva compra
  nuevaCompra(): void {

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

    this.comprasService.nuevaCompra(data).subscribe(() => {
      this.listarCompras();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar compra
  actualizarCompra(): void {

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

    this.comprasService.actualizarCompra(this.idCompra, data).subscribe(() => {
      this.listarCompras();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Actualizar estado Activo/Inactivo
  actualizarEstado(compra: any): void {

    const { _id, activo } = compra;

    if (!this.permisos.all) return this.alertService.info('Usted no tiene permiso para realizar esta acción');

    this.alertService.question({ msg: compra.activo ? '¿Quieres dar de baja la compra?' : '¿Quieres dar de alta la compra?', buttonText: compra.activo ? 'Dar de baja' : 'Data de alta' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          const estado = activo ? 'Baja' : 'Alta';
          this.comprasService.altaBajaCompra(_id, {
            estado,
            creatorUser: this.authService.usuario.userId,
            updatorUser: this.authService.usuario.userId
          }).subscribe(() => {
            this.alertService.loading();
            this.listarCompras();
          }, ({ error }) => {
            this.alertService.close();
            this.alertService.errorApi(error.message);
          });
        }
      });
  }

  // Obtener datos de compra
  obtenerCompra(compra: any): void {

    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      compra: compra._id
    }

    this.alertService.loading();

    this.comprasProductosService.listarProductos(parametros).subscribe({
      next: ({ productos }) => {
        this.productos = productos;
        this.compraSeleccionada = compra;
        this.showModalCompra = true;
        this.alertService.close();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  // Calculo de pago total
  calcularPagoTotal(): void {

    let pagoTotalTMP = 0;

    // Sumando montos de formas de pago
    this.compraSeleccionada.formas_pago.map(forma => {
      pagoTotalTMP += forma.monto;
    });

    // Sumando montos de cheques
    this.cheques_compra.map(relacion => {
      pagoTotalTMP += relacion.cheque.importe;
    });

    this.pagoTotal = pagoTotalTMP;

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

  // Abrir detalles de cheque
  abrirDetallesCheque(cheque: any): void {
    this.chequeSeleccionado = cheque;
    this.showModalCompra = false;
    this.showModalEditarCompra = false;
    this.showDetallesCheque = true;
  }

  // Cerrar detalles de cheque
  cerrarDetallesCheque(): void {
    this.showDetallesCheque = false;
    this.showModalEditarCompra = true;
  }

  // Abrir editar compra
  abrirEditarCompra(compra: any): void {

    this.compraSeleccionada = compra;
    this.filtro.parametroProductos = '';
    this.productoSeleccionado = null;
    this.porcentajes = '';
    this.observacion = compra.observacion;

    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      compra: compra._id
    }

    this.alertService.loading();

    this.comprasProductosService.listarProductos(parametros).subscribe({
      next: ({ productos }) => {

        this.productos = productos;

        // Se le agregan los precios de reguardo
        this.productos.map(producto => {
          producto.precio_unitario_resguardo = producto.precio_unitario;
          producto.precio_total_resguardo = producto.precio_total;
        });

        // Se obtienen los cheques relacionados con la compra
        this.comprasChequesService.listarRelaciones({ compra: compra._id }).subscribe({
          next: ({ relaciones }) => {
            this.cheques_compra = relaciones;

            // Se obtienen las ordenes de pago
            this.ordenesPagoCompraService.listarRelaciones({ compra: compra._id }).subscribe({
              next: ({ relaciones }) => {
                this.ordenesPago = relaciones;
                this.calcularPagoTotal();
                this.showModalEditarCompra = true;
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
    this.comprasService.actualizarCompra(this.compraSeleccionada._id, data).subscribe(() => {
      this.observacionActualizadaFlag = true;
      this.listarCompras();
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
    this.comprasProductosService.actualizarProducto(this.productoSeleccionado._id, data).subscribe({
      next: () => {
        let precio_total_compra = 0;
        this.productos.map(producto => {
          if (this.productoSeleccionado._id === producto._id) {
            producto.cantidad = data.cantidad;
            producto.precio_unitario = data.precio_unitario;
            producto.precio_total = data.precio_total
          }
          precio_total_compra += producto.precio_total;
        })
        this.compraSeleccionada.precio_total = precio_total_compra;

        // Se actualiza el precio total de la compra
        this.comprasService.actualizarCompra(this.compraSeleccionada._id, { precio_total: precio_total_compra }).subscribe({
          next: () => this.listarCompras(),
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
          this.comprasProductosService.eliminarProducto(this.productoSeleccionado._id).subscribe({
            next: () => {

              // Se filtra el producto
              this.productos = this.productos.filter(producto => producto._id !== this.productoSeleccionado._id);

              // Se calcula el precio total
              let precio_total_compra = 0;
              this.productos.map(producto => precio_total_compra += producto.precio_total);
              this.compraSeleccionada.precio_total = precio_total_compra;

              // Se actualiza el precio total de la compra
              this.comprasService.actualizarCompra(this.compraSeleccionada._id, { precio_total: precio_total_compra }).subscribe({
                next: () => this.listarCompras(),
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
        this.showModalEditarCompra = false;
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
        compra: this.compraSeleccionada,
        cantidad: this.cantidad,
        precio_unitario: this.precio_unitario,
        precio_total: this.dataService.redondear(this.precio_unitario * this.cantidad, 2),
      }

      this.comprasProductosService.actualizarProducto(idRepetido, data).subscribe({
        next: ({ productos }) => {

          this.productos = productos;

          // Se calcula el precio total
          let precio_total_compra = 0;
          this.productos.map(producto => precio_total_compra += producto.precio_total);
          this.compraSeleccionada.precio_total = precio_total_compra;

          // Se actualiza el precio total de la compra
          this.comprasService.actualizarCompra(this.compraSeleccionada._id, { precio_total: precio_total_compra }).subscribe({
            next: () => {
              this.productoAgregadoFlag = true;
              this.listarCompras();
            },
            error: ({ error }) => this.alertService.errorApi(error.message)
          })

        },
        error: ({ error }) => this.alertService.errorApi(error.message)
      })

    } else {

      const data = {
        compra: this.compraSeleccionada._id,
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

      this.comprasProductosService.nuevoProducto(data).subscribe({

        next: ({ productos }) => {
          // this.filtro.parametroProductos = '';
          this.productos = productos;

          // Se calcula el precio total
          let precio_total_compra = 0;
          this.productos.map(producto => precio_total_compra += producto.precio_total);
          this.compraSeleccionada.precio_total = precio_total_compra;

          // Se actualiza el precio total de la compra
          this.comprasService.actualizarCompra(this.compraSeleccionada._id, { precio_total: precio_total_compra }).subscribe({
            next: () => {
              this.productoAgregadoFlag = true;
              this.listarCompras();
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
    this.showModalEditarCompra = true;
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
        compra: producto.compra,
        precio_unitario: producto.precio_unitario,
        precio_total: producto.precio_total,
        updatorUser: this.authService.usuario.userId,
      })
    });

    this.comprasProductosService.actualizarProductos(data).subscribe({
      next: () => {
        this.porcentajesTotal = '';
        this.compraSeleccionada.precio_total = this.precioConPorcentaje;
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

  // Abrir reportes - Excel
  abrirReportes(): void {
    this.reportes.fechaDesde = '';
    this.reportes.fechaHasta = '';
    this.reportes.activas = 'true';
    this.showModalReportesCompra = true;
  }

  // Reporte - Excel
  reporteExcel(): void {
    this.alertService.question({ msg: 'Generando reporte', buttonText: 'Generar' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.reportesService.comprasExcel(this.reportes).subscribe({
            next: (buffer) => {
              const blob = new Blob([buffer.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              saveAs(blob, `Reporte - Compras - ${format(new Date(),'dd-MM-yyyy')}`);
              this.alertService.close();
              this.showModalReportesCompra = false;
            }, error: ({error}) => this.alertService.errorApi(error.message)
          })
        }
      });
  }

  // Abrir generar venta
  abrirGenerarVenta(compra: any): void {
    this.venta_tipo = 'Propia';
    this.compraSeleccionada = compra;
    this.showModalVenta = true;
    this.showModalEditarCompra = false;
  }

  generarVenta(): void {

    this.alertService.loading();

    const parametros = {
      direccion: this.ordenar.direccion,
      columna: this.ordenar.columna,
      compra: this.compraSeleccionada._id
    }

    this.comprasProductosService.listarProductos(parametros).subscribe({
      next: ({ productos }) => {

        let productosCompra = [];
        let precioTotal = 0;

        productos.map( producto => {
          productosCompra.push({
            cantidad: producto.cantidad,
            creatorUser: this.authService.usuario.userId,
            descripcion: producto.producto.descripcion,
            familia: producto.producto.familia.descripcion,
            precio_original: producto.precio_unitario,
            precio_total: producto.precio_total,
            precio_unitario: producto.precio_unitario,
            producto: producto.producto._id,
            unidad_medida: producto.producto.unidad_medida.descripcion,
            updatorUser: this.authService.usuario.userId,
          })
          precioTotal += producto.precio_total;
        })

        // Adaptacion de localstorage

        localStorage.setItem('venta_productosVenta', JSON.stringify(productosCompra));
        localStorage.setItem('venta_tipo_venta', JSON.stringify(this.venta_tipo));
        localStorage.setItem('venta_porcentajesTotal', "");
        localStorage.setItem('venta_porcentajeAplicadoTotal', JSON.stringify(false));
        localStorage.setItem('venta_precio_total', JSON.stringify(precioTotal));
        localStorage.setItem('venta_clienteSeleccionado', JSON.stringify(null));
        localStorage.setItem('venta_etapa', JSON.stringify("tipo_venta"));

        this.router.navigateByUrl('/dashboard/nueva-venta');

        this.alertService.close();
      
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })

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
    this.listarCompras();
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
    this.listarCompras();
  }

  // Cambiar cantidad de items
  cambiarCantidadItems(): void {
    this.paginaActual = 1
    this.cambiarPagina(1);
  }


}
