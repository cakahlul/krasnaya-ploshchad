import { auth } from '@server/lib/firebase-admin';
import { apiKeysService } from '@server/modules/api-keys/api-keys.service';

type Handler = (
  req: Request,
  context: { params?: Promise<Record<string, string>> },
) => Promise<Response>;

export function withAuthOrApiKey(handler: Handler) {
  return async (
    req: Request,
    context?: { params?: Promise<Record<string, string>> },
  ): Promise<Response> => {
    const apiKey = req.headers.get('x-api-key');

    if (apiKey) {
      const entity = await apiKeysService.validateKey(apiKey);
      if (!entity) {
        return Response.json({ message: 'Unauthorized' }, { status: 401 });
      }
      return handler(req, { params: context?.params });
    }

    const token = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
      await auth.verifyIdToken(token);
      return handler(req, { params: context?.params });
    } catch {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }
  };
}
