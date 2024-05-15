import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroCheques'
})
export class FiltroChequesPipe implements PipeTransform {

  transform(valores: any[], parametro: string, estado: string): any {
    
    // Trabajando con activo boolean
    let filtrados: any[];
  
    if(estado.trim() !== '') filtrados = valores.filter( valor => valor.estado === estado )
    else filtrados = valores;
    
    // Filtrado por parametro
    parametro = parametro.toLocaleLowerCase();
    
    if(parametro.length !== 0){
      return filtrados.filter( valor => { 
        return valor.emisor.toLocaleLowerCase().includes(parametro) ||
               valor.nro_cheque.toLocaleLowerCase().includes(parametro) ||
               valor.banco.descripcion.toLocaleLowerCase().includes(parametro)
      });
    }else{
      return filtrados;
    }

  }

}
