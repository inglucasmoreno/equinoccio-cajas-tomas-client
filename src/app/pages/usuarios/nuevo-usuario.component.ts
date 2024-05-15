import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';

import { UsuariosService } from 'src/app/services/usuarios.service';
import { AlertService } from '../../services/alert.service';

import gsap from 'gsap';
import { CajasService } from 'src/app/services/cajas.service';
import { AuthService } from 'src/app/services/auth.service';
import { CajasUsuariosService } from 'src/app/services/cajas-usuarios.service';

@Component({
  selector: 'app-nuevo-usuario',
  templateUrl: './nuevo-usuario.component.html',
  styles: [
  ]
})
export class NuevoUsuarioComponent implements OnInit {

  // Modals
  public showModalCajaUsuario = false;

  // Estados
  public estadoSeccionCajas = 'Inicial';

  // Permisos
  public permisos = {
    usuarios: 'USUARIOS_NOT_ACCESS',
    productos: 'PRODUCTOS_NOT_ACCESS'
  };

  // Permisos de caja - Usuario
  public permisos_cajas = [];

  // Cajas
  public cajas: any[] = [];
  public cajaSeleccionada: any = "";
  public cajaSeleccionadaFinal: any = null;
  public nuevaCaja: any = {
    descripcion: '',
    saldo: null,
    creatorUser: this.authService.usuario.userId,
    updatorUser: this.authService.usuario.userId,
  }

  // Modelo reactivo
  public usuarioForm: FormGroup;

  constructor(private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private cajasService: CajasService,
    private cajasUsuariosService: CajasUsuariosService,
    private usuariosService: UsuariosService,
    private alertService: AlertService,
    private dataService: DataService
  ) { }

  ngOnInit(): void {

    // Animaciones y Datos de ruta
    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.dataService.ubicacionActual = 'Dashboard - Creando usuario';

    // Formulario reactivo
    this.usuarioForm = this.fb.group({
      usuario: ['', Validators.required],
      apellido: ['', Validators.required],
      nombre: ['', Validators.required],
      dni: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
      repetir: ['', Validators.required],
      role: ['ADMIN_ROLE', Validators.required],
      activo: ['true', Validators.required]
    });

  }

  // Crear nuevo usuario
  nuevoUsuario(): void {

    const { status } = this.usuarioForm;
    const { usuario, apellido, nombre, dni, email, role, password, repetir } = this.usuarioForm.value;

    // Se verifica que los campos no tengan un espacio vacio
    const campoVacio = usuario.trim() === '' ||
      apellido.trim() === '' ||
      dni.trim() === '' ||
      email.trim() === '' ||
      nombre.trim() === '' ||
      password.trim() === '' ||
      repetir.trim() === '';

    // Se verifica si los campos son invalidos
    if (status === 'INVALID' || campoVacio) {
      this.alertService.formularioInvalido();
      return;
    }

    // Se verifica si las contraseñas coinciden
    if (password !== repetir) {
      this.alertService.info('Las contraseñas deben coincidir');
      return;
    }

    // Se agregan los permisos
    let data: any = {
      ...this.usuarioForm.value,
      permisos_cajas: this.permisos_cajas
    };

    // if (role === 'USER_ROLE') data.permisos = this.adicionarPermisos();
    // else data.permisos = [];

    if (role === 'EMPLOYEE_ROLE') data.permisos = ['GASTOS_NAV', 'GASTOS_ALL'];

    this.alertService.loading();  // Comienzo de loading

    // Se crear el nuevo usuario
    this.usuariosService.nuevoUsuario(data).subscribe(({ usuario }) => {

      if (this.cajaSeleccionadaFinal) {

        const dataCaja = {
          caja: this.cajaSeleccionadaFinal._id,
          usuario: usuario._id,
          creatorUser: this.authService.usuario.userId,
          updatorUser: this.authService.usuario.userId,
        };

        this.cajasUsuariosService.nuevaCajaUsuario(dataCaja).subscribe({
          next: () => {
            if (usuario.role === 'ADMIN_ROLE' || usuario.role === 'EMPLOYEE_ROLE') this.router.navigateByUrl('dashboard/usuarios');
            else this.router.navigateByUrl('dashboard/usuarios/permisos/' + usuario._id);
            this.alertService.close();
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        })

      } else {
        if (usuario.role === 'ADMIN_ROLE' || usuario.role === 'EMPLOYEE_ROLE') this.router.navigateByUrl('dashboard/usuarios');
        else this.router.navigateByUrl('dashboard/usuarios/permisos/' + usuario._id);
        this.alertService.close();
      }

    }, (({ error }) => {
      this.alertService.close();  // Finaliza el loading
      this.alertService.errorApi(error.message);
      return;
    }));

  }

  cambiarEstadoModal(estado: string): void {
    this.nuevaCaja.descripcion = '';
    this.nuevaCaja.saldo = null;
    this.cajaSeleccionada = '';
    this.estadoSeccionCajas = estado;
  }

  // Se arma el arreglo de permisos
  adicionarPermisos(): any {

    let permisos: any[] = [];

    // Seccion usuarios
    if (this.permisos.usuarios !== 'USUARIOS_NOT_ACCESS') {
      permisos.push('USUARIOS_NAV');
      permisos.push(this.permisos.usuarios);
    }

    return permisos;

  }

  // Crear y asignar caja
  crearAsignarCaja(): void {

    if (this.nuevaCaja.descripcion.trim() === '' || this.nuevaCaja.saldo === null) {
      this.alertService.info('Debe ingresar un nombre y un saldo de caja');
      return;
    }

    this.alertService.loading();
    this.cajasService.nuevaCaja(this.nuevaCaja).subscribe({
      next: ({ caja }) => {
        this.permisos_cajas.push(caja._id);
        this.cajas.unshift(caja);
        this.cajaSeleccionada = caja._id;
        this.cajaSeleccionadaFinal = caja;
        this.showModalCajaUsuario = false;
        this.alertService.close();
      }, error: ({ error }) => this.alertService.errorApi(error.message)
    })

  }

  seleccionarCaja(): void {

    // Verificar que se seleccione una caja
    if (this.cajaSeleccionada === '') {
      this.alertService.info('Debe seleccionar una caja');
      return;
    }

    this.alertService.loading();

    // Se verifica si la caja ya esta asignada a otro usuario
    this.cajasUsuariosService.getCajaUsuarioPorCaja(this.cajaSeleccionada).subscribe({
      next: ({ cajaUsuario }) => {

        if (cajaUsuario) {
          this.alertService.errorApi('La caja ya esta asignada a otro usuario');
          return;
        }

        // Se el permiso de caja al usuario
        this.permisos_cajas.push(this.cajaSeleccionada);

        this.cajaSeleccionadaFinal = this.cajas.find(caja => caja._id === this.cajaSeleccionada);
        this.showModalCajaUsuario = false;
        this.alertService.close();

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    });

  }

  // Abrir modal de caja de usuario
  abrirModalCajaUsuario(): void {
    this.estadoSeccionCajas = 'Inicial';
    this.cajaSeleccionada = '';
    this.alertService.loading();
    this.cajasService.listarCajas().subscribe({
      next: ({ cajas }) => {
        this.cajas = cajas.filter(caja => caja.activo === true);
        this.showModalCajaUsuario = true;
        this.alertService.close();
      }, error: () => this.alertService.errorApi('Error al listar las cajas')
    })
  }

  desvincularCaja(): void {

    // Se elimina el permiso de caja al usuario
    this.permisos_cajas = this.permisos_cajas.filter(caja => caja !== this.cajaSeleccionada);

    this.cajaSeleccionadaFinal = null;
    this.cajaSeleccionada = '';

  }


}
