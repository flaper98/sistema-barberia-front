export type ProductCategory = 'SHAMPOO' | 'POMADA' | 'ACEITE' | 'NAVAJA' | 'ACCESORIO' | 'OTRO';
export type StockMovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface Product {
  id: number;
  nombre: string;
  categoria: ProductCategory;
  precioVenta: number;
  precioCompra: number;
  stockActual: number;
  stockMinimo: number;
  estado: boolean;
  descripcion?: string;
  codigoBarras?: string;
}

export interface StockMovement {
  id: number;
  productoId: number;
  productoNombre: string;
  tipoMovimiento: StockMovementType;
  cantidad: number;
  fecha: string;
  motivo: string;
  usuarioId: number;
  usuarioNombre: string;
  stockAnterior: number;
  stockNuevo: number;
}

export interface ProductFilters {
  search?: string;
  categoria?: ProductCategory;
  lowStock?: boolean;
  estado?: boolean;
}
