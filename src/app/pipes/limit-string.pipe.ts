import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'limitString'
})
export class LimitStringPipe implements PipeTransform {

  transform(value: string, limit: number, ...args: unknown[]): unknown {

    // Limitar la cantidad de caracteres de un string
    if (value) {
      const trail = args[1] || '...';
      return value.length > limit ? value.substring(0, limit) + trail : value;
    }

    return null;
  }

}
