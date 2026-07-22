export type SaleType    = 'SERVICIO' | 'PRODUCTO' | 'MIXTA';
// Metodos elegibles individualmente. 'MIXTO' tambien puede aparecer en
// Sale.metodoPago, pero es un resumen calculado (dos o mas metodos a la
// vez) -- nunca se elige directo, ver SalePago.
export type PaymentMethod = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'YAPE' | 'PLIN';
export type PaymentMethodSummary = PaymentMethod | 'MIXTO';
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

// Un tramo del pago (ej. mitad efectivo, mitad Yape) -- una venta con un
// solo metodo tiene un unico tramo, por el total completo.
export interface SalePago {
  metodoPago: PaymentMethod;
  monto: number;
}

export interface Sale {
  id: number;
  clienteId?: number;
  clienteNombre?: string;
  // Opcional: no toda venta la atiende un barbero (ej. alguien compra o
  // consume algo sin que sea por un servicio de barberia).
  barberoId?: number;
  barberoNombre?: string;
  usuarioRegistroId: number;
  usuarioRegistroNombre: string;
  tipoVenta: SaleType;
  items: SaleItem[];
  // Resumen: el unico metodo, o 'MIXTO' si se combinaron dos o mas (ver
  // "pagos" para el desglose). Puede venir null: una solicitud creada por
  // un barbero no trae pagos hasta que recepcion la acepta y cobra.
  metodoPago?: PaymentMethodSummary;
  pagos?: SalePago[];
  subtotal: number;
  descuento: number;
  total: number;
  fecha: string;
  estado: SaleStatus;
  citaId?: number;
  notas?: string;
  // Solo viene completo en "Mis Ventas" (GET /sales/by-worker/{id}): lo
  // que le corresponde a ESE barbero de ESA venta (no el total). Null en
  // el resto de los listados, o si la venta todavia no esta COMPLETADA.
  comisionCalculada?: number;
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
  // Opcional: no toda venta la atiende un barbero (ej. alguien compra o
  // consume algo sin que sea por un servicio de barberia).
  barberoId?: number;
  items: SaleItem[];
  // Opcional: el barbero no elige metodo de pago al crear una solicitud,
  // eso lo asigna recepcion al aceptar y cobrar. Puede traer mas de un
  // tramo (ej. mitad efectivo, mitad Yape) -- la suma tiene que coincidir
  // con el total.
  pagos?: SalePago[];
  descuento: number;
  notas?: string;
}
