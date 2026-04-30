import { apiKeysService } from '@server/modules/api-keys/api-keys.service';
import type { ApiKeyEntity } from '@shared/types/api-key.types';

export type ApiKeyHandler = (
  req: Request,
  context: { apiKey: ApiKeyEntity; params?: Promise<Record<string, string>> },
) => Promise<Response>;

export function withApiKey(handler: ApiKeyHandler) {
  return async (
    req: Request,
    context?: { params?: Promise<Record<string, string>> },
  ): Promise<Response> => {
    const key = req.headers.get('x-api-key');

    if (!key) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = await apiKeysService.validateKey(key);
    if (!apiKey) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    return handler(req, { apiKey, params: context?.params });
  };
}
