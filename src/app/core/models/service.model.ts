export type ServiceCategory = 'CORTE' | 'BARBA' | 'TRATAMIENTO' | 'COLOR' | 'COMBO';

// Producto que se entrega gratis al vender el servicio (ej. una cerveza de
// cortesía con un corte premium) -- al completarse la venta, el backend
// descuenta "cantidad" del stock de "productoId" automáticamente.
export interface ServiceCourtesyItem {
  productoId: number;
  productoNombre?: string;
  cantidad: number;
}

export interface BarberService {
  id: number;
  nombre: string;
  categoria: ServiceCategory;
  precio: number;
  precioVariable: boolean;
  duracionMinutos: number;
  estado: boolean;
  descripcion?: string;
  cortesias?: ServiceCourtesyItem[];
}

export interface ServiceFilters {
  search?: string;
  categoria?: ServiceCategory;
  estado?: boolean;
}
