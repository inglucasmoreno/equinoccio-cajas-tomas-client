import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  
  constructor(private authService: AuthService,
              private router: Router){}
  
  // Si estas logueado no podes estar en la pantalla de login
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean>{
      return this.authService.proteccionLogin()
      .pipe(
        tap( logueado => {
          if (!logueado){ this.router.navigateByUrl('/dashboard/home'); }
        })
      );  
    }
  
}
