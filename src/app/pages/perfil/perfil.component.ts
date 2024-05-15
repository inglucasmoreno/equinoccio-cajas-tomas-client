import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { UsuariosService } from '../../services/usuarios.service';
import { AlertService } from '../../services/alert.service';
import { Usuario } from 'src/app/models/usuario.model';
import { DataService } from 'src/app/services/data.service';
import gsap from 'gsap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styles: [
  ]
})
export class PerfilComponent implements OnInit {

  constructor(private authService: AuthService,
              private dataService: DataService,
              private fb: FormBuilder,
              private usuariosService: UsuariosService,
              private alertService: AlertService) { }

  public usuarioLogin: Usuario;
  public passwordForm: FormGroup;

  ngOnInit(): void {
    gsap.from('.gsap-contenido', { y:100, opacity: 0, duration: .2 });
    this.dataService.ubicacionActual = "Dashboard - Perfil";
    this.getUsuario();
    
    // Formulario reactivo para password
    this.passwordForm = this.fb.group({
      password: ['', Validators.required],
      repetir: ['', Validators.required]
    });
  }

  // Obtener datos de usuario
  getUsuario(): void {
    this.alertService.loading();
    this.usuariosService.getUsuario(this.authService.usuario.userId).subscribe( (usuario: Usuario) => {
      this.alertService.close();
      this.usuarioLogin = usuario;
    },({error}) => {
      this.alertService.errorApi(error.msg);
    })
  }

  // Actualizar password
  actualizarPassword(): void {
    this.alertService.loading();
    this.usuariosService.actualizarUsuario(this.usuarioLogin._id, this.passwordForm.value).subscribe( () => {
      this.reiniciarValores();
      this.alertService.success('Contraseña actualizada');
    },({error}) => { 
      this.alertService.errorApi(error.msg)
    });
  }

  // Reiniciar valores
  reiniciarValores(): void {
    this.passwordForm.patchValue({
      password: '',
      repetir: ''
    });
  }

}
