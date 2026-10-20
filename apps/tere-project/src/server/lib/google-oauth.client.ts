import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';

function createOAuthClient(tokens?: Credentials) {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  );

  if (tokens) {
    client.setCredentials(tokens);
  }

  return client;
}

function getAuthUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    state,
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
    prompt: 'consent',
  });
}

export { createOAuthClient, getAuthUrl };
