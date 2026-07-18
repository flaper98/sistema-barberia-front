export interface BusinessConfig {
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  ruc?: string;
  horario?: string;
  logoUrl?: string;
  mensajeBienvenidaWhatsapp?: string;
  mensajeRecordatorioWhatsapp?: string;
}

export const DEFAULT_WHATSAPP_WELCOME_TEMPLATE =
  '¡Hola {nombre}! 👋 Bienvenido/a a {negocio}. Gracias por registrarte con nosotros, ' +
  'cualquier consulta escribinos por acá. ¡Nos vemos pronto! ✂️';

export const DEFAULT_WHATSAPP_REMINDER_TEMPLATE =
  '¡Hola {nombre}! 👋 Te extrañamos en {negocio}. Tenemos promociones especiales esperándote, ' +
  '¡vení a darte un corte! ✂️';

export const DEFAULT_BUSINESS_CONFIG: BusinessConfig = {
  nombre: 'Árabes Barber Studio',
  mensajeBienvenidaWhatsapp: DEFAULT_WHATSAPP_WELCOME_TEMPLATE,
  mensajeRecordatorioWhatsapp: DEFAULT_WHATSAPP_REMINDER_TEMPLATE,
};
