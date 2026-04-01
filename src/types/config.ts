export interface Config {
  token: string;
  userToken?: string;
  botToken?: string;
  appToken?: string;
  updatedAt: string;
}

export interface Profile {
  name: string;
  config: Config;
  isDefault?: boolean;
}

export interface ConfigStore {
  profiles: Record<string, Config>;
  defaultProfile?: string;
}

export interface ConfigOptions {
  configDir?: string;
  profile?: string;
}

/**
 * Token type for command execution.
 * - "user": Use user token (xoxp-). Default for most commands.
 * - "bot": Use bot token (xoxb-). For bot-only features.
 * - "auto": Default to user token, --as-bot flag switches to bot token.
 */
export type TokenType = 'user' | 'bot' | 'auto';
