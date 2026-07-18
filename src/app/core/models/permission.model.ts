export type Modulo =
  | 'DASHBOARD'
  | 'VENTAS'
  | 'CITAS'
  | 'CLIENTES'
  | 'BARBEROS'
  | 'SERVICIOS'
  | 'PRODUCTOS'
  | 'INVENTARIO'
  | 'FIDELIZACION'
  | 'FINANZAS'
  | 'REPORTES'
  | 'CONFIGURACION';

export interface PermisoFlags {
  puedeVer: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}

export type PermisoPorModulo = Partial<Record<Modulo, PermisoFlags>>;

export type RolConfigurable = 'BARBER' | 'CASHIER' | 'RECEPTION';

export type MatrizPermisos = Record<RolConfigurable, PermisoPorModulo>;

export interface RolPermisoItem {
  rol: RolConfigurable;
  modulo: Modulo;
  puedeVer: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}

export const MODULOS: { value: Modulo; label: string }[] = [
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'VENTAS', label: 'Ventas' },
  { value: 'CITAS', label: 'Citas' },
  { value: 'CLIENTES', label: 'Clientes' },
  { value: 'BARBEROS', label: 'Barberos' },
  { value: 'SERVICIOS', label: 'Servicios' },
  { value: 'PRODUCTOS', label: 'Productos' },
  { value: 'INVENTARIO', label: 'Inventario' },
  { value: 'FIDELIZACION', label: 'Fidelización' },
  { value: 'FINANZAS', label: 'Finanzas' },
  { value: 'REPORTES', label: 'Reportes' },
  { value: 'CONFIGURACION', label: 'Configuración' },
];

export const ROLES_CONFIGURABLES: { value: RolConfigurable; label: string }[] = [
  { value: 'BARBER', label: 'Barbero' },
  { value: 'CASHIER', label: 'Cajero' },
  { value: 'RECEPTION', label: 'Recepción' },
];
