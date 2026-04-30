function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in your Claude Code MCP server configuration.`,
    );
  }
  return value;
}

export const config = {
  get apiUrl(): string {
    return requireEnv('TERE_API_URL');
  },
  get apiKey(): string {
    return requireEnv('TERE_API_KEY');
  },
};
