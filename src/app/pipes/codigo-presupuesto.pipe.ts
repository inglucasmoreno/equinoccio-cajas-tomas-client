import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'codigoPresupuesto'
})
export class CodigoPresupuestoPipe implements PipeTransform {

  transform(nro: number): string {
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
