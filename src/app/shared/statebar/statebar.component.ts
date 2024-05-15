import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-statebar',
  templateUrl: './statebar.component.html',
  styles: [
  ]
})
export class StatebarComponent implements OnInit {

  public showSaldo = this.authService.usuario.role === 'EMPLOYEE_ROLE' ? true : false;

  public usuarioLogin: any = null;
  public permisoCajas: boolean = false;
  public permisoGastos: boolean = false;
  public permisoMovimientos: boolean = false;
  public permisoVentas: boolean = false;

  constructor(
    public authService: AuthService,
    public dataService: DataService,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.usuarioLogin = this.authService.usuario;
    this.calculoPermisos();
  }
  
  calculoPermisos(): void {
    this.permisoCajas = this.usuarioLogin?.permisos?.includes('CAJAS_NAV') || this.usuarioLogin?.role === 'ADMIN_ROLE';
    this.permisoGastos = (this.usuarioLogin?.permisos?.includes('GASTOS_NAV') || this.usuarioLogin?.role === 'ADMIN_ROLE') && this.usuarioLogin?.role !== 'EMPLOYEE_ROLE';
    this.permisoMovimientos = this.usuarioLogin?.permisos?.includes('MOVIMIENTOS_INTERNOS_NAV') || this.usuarioLogin?.role === 'ADMIN_ROLE';
    this.permisoVentas = this.usuarioLogin?.permisos?.includes('VENTAS_PROPIAS_NAV') || this.usuarioLogin?.role === 'ADMIN_ROLE';
  }

  // Metodo: Cerrar sesion
  logout(): void { this.authService.logout(); }

}
