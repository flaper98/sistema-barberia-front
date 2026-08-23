export interface WhatsAppConfig {
  phoneNumberId?: string;
  accessTokenConfigured: boolean;
  templateName?: string;
  languageCode?: string;
  graphApiVersion?: string;
  enabled: boolean;
  updatedAt?: string;
}

export interface WhatsAppConfigRequest {
  phoneNumberId: string;
  accessToken?: string;
  templateName: string;
  languageCode: string;
  graphApiVersion: string;
  enabled: boolean;
}
