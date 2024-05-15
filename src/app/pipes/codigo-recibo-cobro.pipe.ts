import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'codigoReciboCobro'
})
export class CodigoReciboCobroPipe implements PipeTransform {

  transform(nro: number): string {
    let codigo: string;
    if(nro <= 9)  codigo = 'RC000000' + String(nro);
    else if(nro <= 99) codigo = 'RC00000' + String(nro);
    else if(nro <= 999) codigo = 'RC0000' + String(nro);
    else if(nro <= 9999) codigo = 'RC000' + String(nro);
    else if(nro <= 99999) codigo = 'RC00' + String(nro);
    else if(nro <= 999999) codigo = 'RC0' + String(nro);   
    return codigo;         
  }

}
