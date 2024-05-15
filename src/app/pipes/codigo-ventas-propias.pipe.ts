import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'codigoVentasPropias'
})
export class CodigoVentasPropiasPipe implements PipeTransform {

  transform(nro: number): string {
    let codigo: string;
    if(nro <= 9)  codigo = 'VP000000' + String(nro);
    else if(nro <= 99) codigo = 'VP00000' + String(nro);
    else if(nro <= 999) codigo = 'VP0000' + String(nro);
    else if(nro <= 9999) codigo = 'VP000' + String(nro);
    else if(nro <= 99999) codigo = 'VP00' + String(nro);
    else if(nro <= 999999) codigo = 'VP0' + String(nro);   
    return codigo;         
  }

}
