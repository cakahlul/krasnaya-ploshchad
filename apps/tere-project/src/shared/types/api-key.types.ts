export interface ApiKeyEntity {
  id?: string;
  name: string;
  hashedKey: string;
  createdBy: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  isActive: boolean;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt: string | null;
  isActive: boolean;
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface CreateApiKeyResponse extends ApiKeyResponse {
  rawKey: string;
}
