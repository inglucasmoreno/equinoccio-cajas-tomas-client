import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import gsap from 'gsap';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styles: [
  ]
})
export class HomeComponent implements OnInit {

  public usuarioLogin: any = null;
  public permisoCajas: boolean = false;
  public permisoGastos: boolean = false;
  public permisoMovimientos: boolean = false;
  public permisoVentas: boolean = false;

  constructor(
    public authService: AuthService,
    private dataService: DataService,
  ) { }

  ngOnInit(): void { 
    gsap.from('.gsap-contenido', { y:100, opacity: 0, duration: .2 });
    this.usuarioLogin = this.authService.usuario;
    this.dataService.ubicacionActual = 'Dashboard - Home';
    this.calculoPermisos();
  }

  calculoPermisos(): void {
    this.permisoCajas = this.usuarioLogin.permisos.includes('CAJAS_NAV') || this.usuarioLogin.role === 'ADMIN_ROLE';
    this.permisoGastos = this.usuarioLogin.permisos.includes('GASTOS_NAV') || this.usuarioLogin.role === 'ADMIN_ROLE';
    this.permisoMovimientos = this.usuarioLogin.permisos.includes('MOVIMIENTOS_INTERNOS_NAV') || this.usuarioLogin.role === 'ADMIN_ROLE';
    this.permisoVentas = this.usuarioLogin.permisos.includes('VENTAS_PROPIAS_NAV') || this.usuarioLogin.role === 'ADMIN_ROLE';
  }
  
}
