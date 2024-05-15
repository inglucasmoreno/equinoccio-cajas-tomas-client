import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroCcClientesMovimientos'
})
export class FiltroCcClientesMovimientosPipe implements PipeTransform {

  transform(valores: any[], parametro: string): any {
        
    // Filtrado por parametro
    parametro = parametro.toLocaleLowerCase();
    
    if(parametro.length !== 0){
      return valores.filter( valor => { 
        return valor.descripcion.toLocaleLowerCase().includes(parametro)
      });
    }else{
      return valores;
    }

  }

}
