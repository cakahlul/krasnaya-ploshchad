// OAuth2 authorization URL response
export interface GoogleAuthUrlResponseDto {
  authUrl: string; // URL for user to authorize the application
  message: string; // Instructions for the user
}

// OAuth2 callback query parameters
export interface GoogleAuthCallbackDto {
  code: string; // Authorization code from Google
}

// OAuth2 token response
export interface GoogleAuthTokenResponseDto {
  accessToken: string; // Access token for Google API
  expiresIn: number; // Token expiration time in seconds
  message: string; // Success message
}
