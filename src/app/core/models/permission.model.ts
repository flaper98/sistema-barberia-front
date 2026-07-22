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
  | 'CONFIGURACION'
  | 'COMISIONES';

export interface PermisoFlags {
  puedeVer: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  // Solo tiene sentido para el modulo COMISIONES (ver el detalle por item
  // de ventas/comisiones de un barbero, con fecha) -- en el resto de los
  // modulos siempre viene en false, sin usarse.
  puedeVerDetalle: boolean;
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
  puedeVerDetalle: boolean;
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
  { value: 'COMISIONES', label: 'Comisiones' },
];

export const ROLES_CONFIGURABLES: { value: RolConfigurable; label: string }[] = [
  { value: 'BARBER', label: 'Barbero' },
  { value: 'CASHIER', label: 'Cajero' },
  { value: 'RECEPTION', label: 'Recepción' },
];
