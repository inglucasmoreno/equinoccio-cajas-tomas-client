// Modelo - Usuario Online
export class UsuarioOnline {
    constructor(
        public userId: string,
        public usuario: string,
        public nombre: string,
        public apellido: string,
        public role: string,
        public permisos: string[],
        public permisos_cajas: string[],
    ){}   
}