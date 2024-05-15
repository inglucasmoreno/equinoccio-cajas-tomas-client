import { Directive, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appPermisos]'
})
export class PermisosDirective implements OnInit {
  
  private usuarioLogin: any;
  private permisos: any;

  constructor(private templateRef: TemplateRef<any>,
              private viewContainer: ViewContainerRef,
              private authService: AuthService) {}

  ngOnInit(): void {
    this.usuarioLogin = this.authService.usuario;
    this.actualizarVista();
  }

  // Se reciben los permisos
  @Input()
  set appPermisos(val: Array<string>){
    this.permisos = val;     // Permisos del elemento
    this.actualizarVista();
  }

  // Actualizacion de vista
  private actualizarVista(): void{
    this.viewContainer.clear();
    if(this.comprobarPermisos()) this.viewContainer.createEmbeddedView(this.templateRef); // Se muestra el elemento si se tienen permisos
  }

  // Comparacion de permisos de elemento y usuario
  private comprobarPermisos(): boolean {
    
    if(this.usuarioLogin && this.usuarioLogin.role !== 'ADMIN_ROLE'){  // Los permisos se evaluan si no son administradores

      let tienePermiso = false;
    
      if(this.usuarioLogin && this.usuarioLogin.permisos){ // Si existe testing - Reemplazar por datos de usuario
        
        for (const checkPermisos of this.permisos) {
          
          const coincide = this.usuarioLogin.permisos.find( (p: string) => {
            return (p.toUpperCase() === checkPermisos.toUpperCase());
          });
          
          if(coincide) {  // Si hay coincidencia se devuelve true y se finaliza el bucle
            tienePermiso = true;
            break
          }
  
        }  
      
      }

      return tienePermiso;

    }else{ // Si es administrador devuelve TRUE
      return true;
    }
  
  }

}
