import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'rol'
})
export class RolPipe implements PipeTransform {

  transform(role: string): string {
    switch (role) {
      case 'ADMIN_ROLE':
        return 'Administrador'
      case 'USER_ROLE':
        return 'Estandar'
      default:
        break;
    }
    return null;
  }

}
