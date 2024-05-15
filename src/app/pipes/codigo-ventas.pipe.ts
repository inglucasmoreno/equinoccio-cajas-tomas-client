import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'codigoVentas'
})
export class CodigoVentasPipe implements PipeTransform {

  transform(nro: number): string {
    let codigo: string;
    if(nro <= 9)  codigo = 'VD000000' + String(nro);
    else if(nro <= 99) codigo = 'VD00000' + String(nro);
    else if(nro <= 999) codigo = 'VD0000' + String(nro);
    else if(nro <= 9999) codigo = 'VD000' + String(nro);
    else if(nro <= 99999) codigo = 'VD00' + String(nro);
    else if(nro <= 999999) codigo = 'VD0' + String(nro);   
    return codigo;         
  }

}
