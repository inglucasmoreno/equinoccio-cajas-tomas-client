import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'codigoOrdenesPago'
})
export class CodigoOrdenesPagoPipe implements PipeTransform {

  transform(nro: number): string {
    let codigo: string;
    if(nro <= 9)  codigo = 'OP000000' + String(nro);
    else if(nro <= 99) codigo = 'OP00000' + String(nro);
    else if(nro <= 999) codigo = 'OP0000' + String(nro);
    else if(nro <= 9999) codigo = 'OP000' + String(nro);
    else if(nro <= 99999) codigo = 'OP00' + String(nro);
    else if(nro <= 999999) codigo = 'OP0' + String(nro);   
    return codigo;         
  }

}
