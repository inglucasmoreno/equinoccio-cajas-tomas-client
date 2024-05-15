import { Component, OnInit } from '@angular/core';
import { UsuariosService } from 'src/app/services/usuarios.service';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from 'src/app/services/auth.service';
import { CajasService } from 'src/app/services/cajas.service';
import { CajasUsuariosService } from 'src/app/services/cajas-usuarios.service';

@Component({
  selector: 'app-permisos',
  templateUrl: './permisos.component.html',
  styles: [
  ]
})
export class PermisosComponent implements OnInit {

  public idUsuario: string = '';
  public usuario = null;
  public permisos = [];
  public secciones = [
    'PRESUPUESTOS',
    'VENTAS_DIRECTAS',
    'VENTAS_PROPIAS',
    'RECIBOS_COBRO',
    'CLIENTES',
    'CUENTAS_CORRIENTES_CLIENTES',
    'COMPRAS',
    'ORDENES_PAGO',
    'PROVEEDORES',
    'CUENTAS_CORRIENTES_PROVEEDORES',
    'CAJAS',
    'MOVIMIENTOS_INTERNOS',
    'CHEQUES',
    'BANCOS',
    'GASTOS',
    'USUARIOS',
    'TIPOS_GASTOS',
    'UNIDADES_MEDIDA',
    'FAMILIA_PRODUCTOS',
    'PRODUCTOS',
  ]

  public muestraSecciones = {
    compras: false,
    ventas: false,
    tesoreria: false,
    configuraciones: false,
  }

  public muestraCajas = false;
  public muestraSistema = false;

  public cajaPrincipalUsuario: any = null;

  public cajas = [];

  public permisosCajas = [];

  public permisosSecciones = {

    // Seccion - Ventas
    PRESUPUESTOS: 'PRESUPUESTOS_ALL',
    VENTAS_DIRECTAS: 'VENTAS_DIRECTAS_NOT_ACCESS',
    VENTAS_PROPIAS: 'VENTAS_PROPIAS_NOT_ACCESS',
    RECIBOS_COBRO: 'RECIBOS_COBRO_NOT_ACCESS',
    CLIENTES: 'CLIENTES_NOT_ACCESS',
    CUENTAS_CORRIENTES_CLIENTES: 'CUENTAS_CORRIENTES_CLIENTES_NOT_ACCESS',
    COMPRAS: 'COMPRAS_NOT_ACCESS',
    ORDENES_PAGO: 'ORDENES_PAGO_NOT_ACCESS',
    PROVEEDORES: 'PROVEEDORES_NOT_ACCESS',
    CUENTAS_CORRIENTES_PROVEEDORES: 'CUENTAS_CORRIENTES_PROVEEDORES_NOT_ACCESS',
    CAJAS: 'CAJAS_NOT_ACCESS',
    MOVIMIENTOS_INTERNOS: 'MOVIMIENTOS_INTERNOS_NOT_ACCESS',
    CHEQUES: 'CHEQUES_NOT_ACCESS',
    BANCOS: 'BANCOS_NOT_ACCESS',
    GASTOS: 'GASTOS_NOT_ACCESS',
    USUARIOS: 'USUARIOS_NOT_ACCESS',
    TIPOS_GASTOS: 'TIPOS_GASTOS_NOT_ACCESS',
    UNIDADES_MEDIDA: 'UNIDADES_MEDIDA_NOT_ACCESS',
    FAMILIA_PRODUCTOS: 'FAMILIA_PRODUCTOS_NOT_ACCESS',
    PRODUCTOS: 'PRODUCTOS_NOT_ACCESS',

  }

  constructor(
    public authService: AuthService,
    private usuariosService: UsuariosService,
    private cajasUsuariosService: CajasUsuariosService,
    private alertService: AlertService,
    private activatedRoute: ActivatedRoute,
    private cajasService: CajasService
  ) { }

  ngOnInit(): void {
    this.alertService.loading();
    this.activatedRoute.params.subscribe({
      next: ({ id }) => {
        this.idUsuario = id;
        this.getUsuario();
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    });
  }

  public getUsuario = () => {
    this.usuariosService.getUsuario(this.idUsuario).subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.permisos = usuario.permisos;
        this.permisosCajas = usuario.permisos_cajas;
        this.adaptandoPermisos();
        this.cajasService.listarCajas().subscribe({
          next: ({cajas}) => {
            this.cajas = cajas;
            this.cajasUsuariosService.getCajaUsuarioPorUsuario(this.idUsuario).subscribe({
              next: ({ cajaUsuario }) => { 
                this.cajaPrincipalUsuario = cajaUsuario && cajaUsuario.caja;
                this.alertService.close();
              }, error: ({ error }) => this.alertService.errorApi(error.message)
            });
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })
      },
      error: ({ error }) => this.alertService.errorApi(error.message)
    })
  }

  public adaptandoPermisos = () => {
    this.secciones.map( seccion => {      
      if (this.permisos.includes(`${seccion}_READ`)) this.permisosSecciones[seccion] = `${seccion}_READ`;
      else if (this.permisos.includes(`${seccion}_ALL`)) this.permisosSecciones[seccion] = `${seccion}_ALL`;
      else this.permisosSecciones[seccion] = `${seccion}_NOT_ACCESS`;
    })
  }

  public abrirCerrarSeccion = (seccion: string) => {
    this.muestraSecciones[seccion] = !this.muestraSecciones[seccion];
  }

  public abrirCerrarCajas = () => {
    this.muestraCajas = !this.muestraCajas;
  }

  public abrirCerrarSistema = () => {
    this.muestraSistema = !this.muestraSistema;
  }

  public guardarPermisos = () => {
    
    this.alertService.loading();

    let nuevosPermisos = [];

    // Recorrer arreglo y guardar contenido en nuevosPermisos
    this.secciones.map( seccion => {
      nuevosPermisos.push(this.permisosSecciones[seccion]);
      if(this.permisosSecciones[seccion] !== `${seccion}_NOT_ACCESS`) nuevosPermisos.push(`${seccion}_NAV`);
    });

    this.usuariosService.actualizarUsuario(this.idUsuario, {
      permisos: nuevosPermisos,
      permisos_cajas: this.permisosCajas,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    }).subscribe({
      next: () => {
        this.alertService.success('Permisos actualizados!');
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    });

  }

  cambiarPermisoCaja = (caja: string) => {
    if(this.permisosCajas.includes(caja)) this.permisosCajas = this.permisosCajas.filter(permiso => permiso !== caja);
    else this.permisosCajas.push(caja);
    console.log(this.permisosCajas);
  }

}
