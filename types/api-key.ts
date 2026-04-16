export interface ApiKey {
  id: number;
  name: string;
  permission: "read" | "read-write";
  active: boolean;
  expires?: string;
  createdAt: string;
}

export interface ApiKeyCreated extends ApiKey {
  key: string;
}

export interface CreateApiKeyDto {
  name: string;
  permission: "read" | "read-write";
  expiresAt?: string;
}
