import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from '../../services/auth.service';
import { items } from './items';
import { itemsProductos } from './items-productos';
import { itemsPresupuestos } from './items-presupuestos';
import { itemsVentas } from './items-ventas';
import { itemsCajas } from './items-cajas';
import { itemsConfiguraciones } from './items-configuraciones';
import { itemsCompras } from './items-compras';
import { itemsCobros } from './items-cobros';
import { itemsTesoreria } from './items-tesoreria';
import { itemsTerceros } from './items-terceros';
import { itemsGastos } from './items-gastos';
import { itemsPagos } from './items-pagos';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styles: [
  ]
})
export class HeaderComponent implements OnInit {

  // Items
  public items: any[];
  public itemsPresupuestos: any[];
  public itemsProductos: any[];
  public itemsVentas: any[];
  public itemsCobros: any[];
  public itemsCajas: any[];
  public itemsCompras: any[];
  public itemsPagos: any[];
  public itemsTesoreria: any[];
  public itemsTerceros: any[];
  public itemsConfiguraciones: any[];
  public itemsGastos: any[];

  // Flags - Navegacion
  public administrador = false;
  public showProductos = false;
  public showPresupuestos = false;
  public showVentas = false;
  public showCobros = false;
  public showCajas = false;
  public showCompras = false;
  public showPagos = false;
  public showTesoreria = false;
  public showTerceros = false;
  public showConfiguraciones = false;
  public showGastos = false;

  // Permisos para navegacion
  public permiso_usuarios = true;

  constructor(public authService: AuthService,
    public alertService: AlertService,
    public dataService: DataService) { }

  ngOnInit(): void {
    
    this.items = items;
    this.itemsProductos = itemsProductos;
    this.itemsPresupuestos = itemsPresupuestos;
    this.itemsVentas = itemsVentas;
    this.itemsCobros = itemsCobros;
    this.itemsCajas = itemsCajas;
    this.itemsCompras = itemsCompras;
    this.itemsPagos = itemsPagos;
    this.itemsTesoreria = itemsTesoreria;
    this.itemsTerceros = itemsTerceros;
    this.itemsConfiguraciones = itemsConfiguraciones;
    this.itemsGastos = itemsGastos;

    this.authService.getCaja();

  }

  // Abrir/Cerrar navegacion
  abrirCerrarMenu(menu: string): void {

    switch (menu) {
      case 'ventas':
        this.showVentas = !this.showVentas;
        break;
      case 'compras':
        this.showCompras = !this.showCompras;
        break;
      case 'tesoreria':
        this.showTesoreria = !this.showTesoreria;
        break;
      case 'configuraciones':
        this.showConfiguraciones = !this.showConfiguraciones;
        break;
      default:
        break;
    }

    menu != 'ventas' ? this.showVentas = false : null;
    menu != 'compras' ? this.showCompras = false : null;
    menu != 'tesoreria' ? this.showTesoreria = false : null;
    menu != 'configuraciones' ? this.showConfiguraciones = false : null;

  }

  // Metodo: Cerrar sesion
  logout(): void { this.authService.logout(); }

}
