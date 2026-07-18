import { DEFAULT_WHATSAPP_WELCOME_TEMPLATE } from '../models/business-config.model';

const CODIGO_PAIS = '51';

export function renderWhatsappTemplate(plantilla: string, cliente: { nombre: string }, negocio: string): string {
  return plantilla.replace(/\{nombre\}/g, cliente.nombre).replace(/\{negocio\}/g, negocio);
}

export function buildWhatsappLink(
  cliente: { nombre: string; telefono: string },
  negocio = 'Árabes Barber Studio',
  plantilla: string = DEFAULT_WHATSAPP_WELCOME_TEMPLATE,
): string {
  const digitos = cliente.telefono.replace(/\D/g, '');
  const numero = digitos.length === 9 ? `${CODIGO_PAIS}${digitos}` : digitos;
  const mensaje = renderWhatsappTemplate(plantilla, cliente, negocio);
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}
