import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

import { AlertService } from '../../services/alert.service';
import gsap from 'gsap';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styles: []
})
export class LoginComponent implements OnInit {
  
  public loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(private fb: FormBuilder,
              private alertService: AlertService,
              private authService: AuthService,
              private router: Router  
  ) {}

  ngOnInit(): void {

    var tl = gsap.timeline({ defaults: { duration: 0.1 } });
    tl.from('.gsap-formulario', { y:-100, opacity: 0, duration: .5 })
      .from('.gsap-fondo', { opacity: 0, duration: .5 })
      .from('.gsap-imagen', { y:100, opacity: 0, duration: .5 })
      .from('.gsap-slogan', { y:100, opacity: 0, duration: .5 });

  }

  login(): void {
    // Verificacion - Datos de acceso
    const { username, password } = this.loginForm.value;      
    if(username.trim() === '' || password.trim() === ''){
      this.alertService.formularioInvalido();
      return;
    }  
    this.alertService.loading();
    this.authService.login(this.loginForm.value).subscribe(({ user })=> {
      this.alertService.close();     
      console.log(user.role);
      if(user.role === 'EMPLOYEE_ROLE') this.router.navigateByUrl('dashboard/gastos');
      else this.router.navigateByUrl('dashboard/home');
      
    },({error}) => {
      this.loginForm.setValue({ username: '', password: '' });
      this.alertService.errorApi(error.message);  
    });
  }

  examen(): void {
    this.router.navigateByUrl('/examen');
  }

}
