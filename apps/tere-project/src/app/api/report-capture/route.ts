import { withDeveloper, type AuthWrapper } from '@server/auth/with-developer';
import { handleDeveloperCapturePost } from '@server/modules/report-capture/report-capture-http';
import { developerCaptureService } from '@server/modules/report-capture/report-capture-runtime';

export const dynamic = 'force-dynamic';

export function createDeveloperCapturePost(service = developerCaptureService, authWrapper?: AuthWrapper) {
  return withDeveloper(req => handleDeveloperCapturePost(req, service), authWrapper);
}

export const POST = createDeveloperCapturePost();
