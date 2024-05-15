import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'codigoCompras'
})
export class CodigoComprasPipe implements PipeTransform {

  transform(nro: number): string {
    let codigo: string;
    if(nro <= 9)  codigo = 'C000000' + String(nro);
    else if(nro <= 99) codigo = 'C00000' + String(nro);
    else if(nro <= 999) codigo = 'C0000' + String(nro);
    else if(nro <= 9999) codigo = 'C000' + String(nro);
    else if(nro <= 99999) codigo = 'C00' + String(nro);
    else if(nro <= 999999) codigo = 'C0' + String(nro);   
    return codigo;         
  }

}
