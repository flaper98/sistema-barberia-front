export interface IcloudConfig {
  username?: string;
  passwordConfigured: boolean;
  enabled: boolean;
  updatedAt?: string;
}

export interface IcloudConfigRequest {
  username: string;
  appPassword?: string;
  enabled: boolean;
}
