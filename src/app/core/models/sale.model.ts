export type SaleType    = 'SERVICIO' | 'PRODUCTO' | 'MIXTA';
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN';
export type SaleStatus  = 'COMPLETADA' | 'ANULADA' | 'PENDIENTE';

export interface SaleItem {
  tipo: 'SERVICIO' | 'PRODUCTO' | 'PAQUETE';
  itemId: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
  /** Solo frontend: true si el precio de esta línea puede editarse en el carrito (servicios de precio variable). No se envía como tal al backend, pero Jackson lo ignora sin problema. */
  precioEditable?: boolean;
}

export interface Sale {
  id: number;
  clienteId?: number;
  clienteNombre?: string;
  barberoId: number;
  barberoNombre: string;
  usuarioRegistroId: number;
  usuarioRegistroNombre: string;
  tipoVenta: SaleType;
  items: SaleItem[];
  metodoPago: PaymentMethod;
  subtotal: number;
  descuento: number;
  total: number;
  fecha: string;
  estado: SaleStatus;
  citaId?: number;
  notas?: string;
}

export interface SaleFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  barberoId?: number;
  tipoVenta?: SaleType;
  estado?: SaleStatus;
}

export interface QuickSaleForm {
  clienteId?: number;
  barberoId: number;
  items: SaleItem[];
  metodoPago: PaymentMethod;
  descuento: number;
  notas?: string;
}
