// Module
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { PagesModule } from './pages/pages.module';
import { AuthModule } from './auth/auth.module';
import { NgxPaginationModule } from 'ngx-pagination';
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

// Componentes
import { AppComponent } from './app.component';
import { ErrorPageComponent } from './error-page/error-page.component';
import { SharedModule } from './shared/shared.module';
import { InicializacionComponent } from './inicializacion/inicializacion.component';
import { FormsModule } from '@angular/forms';
import { PipesModule } from './pipes/pipes.module';
import { environment } from '../environments/environment';

const config: SocketIoConfig = { url: environment.base_url, options: {} };

@NgModule({
  declarations: [
    AppComponent,
    ErrorPageComponent,
    InicializacionComponent,
  ],
  imports: [
    BrowserModule,
    SocketIoModule.forRoot(config),
    AppRoutingModule,
    PagesModule,
    AuthModule,
    PipesModule,
    HttpClientModule,
    SharedModule,
    NgxPaginationModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
