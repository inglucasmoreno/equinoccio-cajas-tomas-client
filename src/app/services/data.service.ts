import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  
  public ubicacionActual: string = 'Dashboard';   // Statebar - Direccion actual
  public showMenu: Boolean = false;               // Header - Controla la visualizacion de la barra de navegacion

  constructor() {}

  // Redonde de numeros
  redondear(numero:number, decimales:number):number {

    if (typeof numero != 'number' || typeof decimales != 'number') return null;

    let signo = numero >= 0 ? 1 : -1;

    return Number((Math.round((numero * Math.pow(10, decimales)) + (signo * 0.0001)) / Math.pow(10, decimales)).toFixed(decimales));
  
  }

  // Adaptando codigo
  codigo(nro: number) {
    let codigo: string;
    if(nro <= 9)  codigo = 'P000000' + String(nro);
    else if(nro <= 99) codigo = 'P00000' + String(nro);
    else if(nro <= 999) codigo = 'P0000' + String(nro);
    else if(nro <= 9999) codigo = 'P000' + String(nro);
    else if(nro <= 99999) codigo = 'P00' + String(nro);
    else if(nro <= 999999) codigo = 'P0' + String(nro);   
    return codigo; 
  }
    
}
