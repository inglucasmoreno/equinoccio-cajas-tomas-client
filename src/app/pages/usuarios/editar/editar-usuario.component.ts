import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Usuario } from '../../../models/usuario.model';
import { UsuariosService } from '../../../services/usuarios.service';
import { AlertService } from 'src/app/services/alert.service';
import { DataService } from 'src/app/services/data.service';

import gsap from 'gsap';
import { CajasUsuariosService } from 'src/app/services/cajas-usuarios.service';
import { CajasService } from 'src/app/services/cajas.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-editar-usuario',
  templateUrl: './editar-usuario.component.html',
  styles: [
  ]
})
export class EditarUsuarioComponent implements OnInit {

  // Modals
  public estadoModal = 'NuevaCaja';
  public showModalCajaUsuario = false;

  // Permisos
  public permisos = {
    usuarios: 'USUARIOS_NOT_ACCESS',
    productos: 'PRODUCTOS_NOT_ACCESS'
  };

  // CajaUsuario
  public cajaUsuario: any;
  
  // Cajas
  public cajas: any[] = [];
  public cajaSeleccionada: any = '';
  public nuevaCaja: any = {
    descripcion: '',
    saldo: null,
    creatorUser: this.authService.usuario.userId,
    updatorUser: this.authService.usuario.userId,
  }

  // Usuario
  public id: string;
  public usuario: any;
  public usuarioForm: FormGroup;

  constructor(private router: Router,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private alertService: AlertService,
    private cajasUsuariosService: CajasUsuariosService,
    private cajasService: CajasService,
    private dataService: DataService) { }

  ngOnInit(): void {

    // Animaciones y Datos de ruta
    gsap.from('.gsap-contenido', { y: 100, opacity: 0, duration: .2 });
    this.dataService.ubicacionActual = 'Dashboard - Editando usuario';

    // Formulario reactivo
    this.usuarioForm = this.fb.group({
      usuario: ['', Validators.required],
      apellido: ['', Validators.required],
      nombre: ['', Validators.required],
      dni: ['', Validators.required],
      email: ['', Validators.email],
      role: ['USER_ROLE', Validators.required],
      activo: ['true', Validators.required],
    });

    this.getUsuario(); // Datos iniciales de usuarios

  }

  // Datos iniciales de usuarios
  getUsuario(): void {

    // Se buscan los datos iniciales del usuario a editar
    this.alertService.loading();
    this.activatedRoute.params.subscribe(({ id }) => { this.id = id; });
    this.usuariosService.getUsuario(this.id).subscribe(usuarioRes => {

      // Marcar permisos
      this.getPermisos(usuarioRes.permisos); // Se obtienen los permisos

      this.usuario = usuarioRes;
      const { usuario, apellido, nombre, dni, email, role, activo } = this.usuario;

      this.usuarioForm.patchValue({
        usuario,
        apellido,
        nombre,
        dni,
        email,
        role,
        activo: String(activo)
      });

      // Caja de usuario
      this.cajasUsuariosService.getCajaUsuarioPorUsuario(this.id).subscribe(({ cajaUsuario }) => {
        this.cajaUsuario = cajaUsuario;
        this.alertService.close();
      }, ({ error }) => {
        this.alertService.errorApi(error.message);
      });

    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });

  }

  // Se obtienen los permisos
  getPermisos(permisosFnc: Array<string>): void {

    permisosFnc.forEach(permiso => {

      // Usuarios
      (permiso === 'USUARIOS_ALL' || permiso === 'USUARIOS_READ') ? this.permisos.usuarios = permiso : null;

      // Productos
      (permiso === 'PRODUCTOS_ALL' || permiso === "PRODUCTOS_READ") ? this.permisos.productos = permiso : null;

    });

  }

  // Editar usuario
  editarUsuario(): void | boolean {

    const { usuario, apellido, dni, role, nombre, email } = this.usuarioForm.value;

    // Se verifica que los campos no tengan un espacio vacio
    const campoVacio = usuario.trim() === '' ||
      apellido.trim() === '' ||
      dni.trim() === '' ||
      email.trim() === '' ||
      nombre.trim() === '';

    // Se verifica que todos los campos esten rellenos
    if (this.usuarioForm.status === 'INVALID' || campoVacio) {
      this.alertService.formularioInvalido()
      return false;
    }

    // Se agregan los permisos
    let data: any = this.usuarioForm.value;

    if(role === 'EMPLOYEE_ROLE') data.permisos = ['GASTOS_NAV', 'GASTOS_ALL'];

    // if(role !== 'ADMIN_ROLE') data.permisos = this.adicionarPermisos(); // Se adicionan los permisos a la data para actualizacion
    // else data.permisos = [];

    this.alertService.loading();

    this.usuariosService.actualizarUsuario(this.id, data).subscribe(() => {
      this.alertService.close();
      this.router.navigateByUrl('dashboard/usuarios');
    }, ({ error }) => {
      this.alertService.close();
      this.alertService.errorApi(error.message);
    });

  }


  // Se arma el arreglo de permisos
  adicionarPermisos(): any {

    let permisos: any[] = [];

    // Seccion usuarios
    if (this.permisos.usuarios !== 'USUARIOS_NOT_ACCESS') {
      permisos.push('USUARIOS_NAV');
      permisos.push(this.permisos.usuarios);
    }

    // Seccion productos
    // if(this.permisos.productos !== 'PRODUCTOS_NOT_ACCESS'){
    //   permisos.push('PRODUCTOS_NAV');
    //   permisos.push(this.permisos.productos);
    // }

    return permisos;

  }

  // Obtener caja de usuario
  obtenerCajaUsuario(): void {
    this.cajasUsuariosService.getCajaUsuarioPorUsuario(this.id).subscribe(({ cajaUsuario }) => {
      console.log(cajaUsuario);
      this.alertService.close();
    }, ({ error }) => {
      this.alertService.errorApi(error.message);
    });
  }

  // Abrir modal de caja de usuario
  abrirModalCajaUsuario(): void {
    this.estadoModal = 'Inicio';
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

  // crear relacion caja usuario
  nuevaCajaUsuario(): void {

    // Verificar si se selecciono una caja
    if (this.cajaSeleccionada === '') {
      this.alertService.info('Debe seleccionar una caja');
      return;
    }

    this.alertService.loading();
    
    const data = {
      usuario: this.id,
      caja: this.cajaSeleccionada,
      creatorUser: this.authService.usuario.userId,
      updatorUser: this.authService.usuario.userId,
    };
    
    this.cajasUsuariosService.nuevaCajaUsuario(data).subscribe({
      next: ({ cajaUsuario }) => {
        this.cajaUsuario = cajaUsuario;

        // Se le asigna permiso de caja si no lo tiene al usuario
        if(!this.usuario.permisos_cajas.includes(this.cajaSeleccionada)){
          
          this.usuario.permisos_cajas.push(this.cajaSeleccionada);
  
          this.usuariosService.actualizarUsuario(this.id, {
            permisos_cajas: this.usuario.permisos_cajas
          }).subscribe({
            next: () => {
              this.showModalCajaUsuario = false;
              this.alertService.success('Caja asignada correctamente');
            }, error: () => this.alertService.errorApi('Error al actualizar los permisos de la caja')
          });

        }else{
          this.alertService.success('Caja asignada correctamente');
          this.showModalCajaUsuario = false;
        }

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    });
  }
  
  // Eliminar caja de usuario
  eliminarCajaUsuario(): void {
    this.alertService.question({ msg: '¿Desvinculando caja?', buttonText: 'Devincular' })
      .then(({ isConfirmed }) => {
        if (isConfirmed) {
          this.alertService.loading();
          this.cajasUsuariosService.eliminarCajaUsuario(this.cajaUsuario._id).subscribe({
            next: () => {
              const nuevosPermisos = this.usuario.permisos_cajas.filter(caja => caja !== this.cajaUsuario.caja._id);
              this.usuario.permisos_cajas = nuevosPermisos;
              this.usuariosService.actualizarUsuario(this.id, { permisos_cajas: nuevosPermisos }).subscribe({
                next: () => {
                  this.cajaUsuario = null;
                  this.alertService.success('Caja desvinculada correctamente');
                }, error: () => this.alertService.errorApi('Error al actualizar los permisos de la caja')
              })
            }, error: ({ error }) => this.alertService.errorApi(error.message)
          });
        }
      });
  }

  // Crear y asignar caja
  crearAsignarCaja(): void {

    if (this.nuevaCaja.descripcion.trim() === '' || this.nuevaCaja.saldo === null) {
      this.alertService.info('Debe completar todos los datos');
      return;
    }

    this.alertService.loading();

    this.cajasService.nuevaCaja(this.nuevaCaja).subscribe({
      next: ({ caja }) => {
        
        const data = {
          usuario: this.id,
          caja: caja._id,
          creatorUser: this.authService.usuario.userId,
          updatorUser: this.authService.usuario.userId,
        };
        
        this.cajasUsuariosService.nuevaCajaUsuario(data).subscribe({
          next: ({ cajaUsuario }) => {
            this.cajaUsuario = cajaUsuario;
            this.showModalCajaUsuario = false;
            this.alertService.success('Caja asignada correctamente');
          }, error: ({ error }) => this.alertService.errorApi(error.message)
        });

      }, error: ({ error }) => this.alertService.errorApi(error.message)
    });

  }

  cambiarEstadoModal(estado: string): void {
    this.nuevaCaja.descripcion = '';
    this.nuevaCaja.saldo = null;
    this.cajaSeleccionada = '';
    this.estadoModal = estado;
  }

  // Funcion del boton regresar
  regresar(): void {
    this.router.navigateByUrl('/dashboard/usuarios');
  }

}
