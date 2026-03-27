import type { Config, TokenType } from '../types/config';
import { ERROR_MESSAGES } from './constants';
import { ConfigurationError } from './errors';
import { ProfileConfigManager } from './profile-config';

/**
 * Helper function to get configuration with proper error handling
 */
export async function getConfigOrThrow(
  profile?: string,
  configManager: ProfileConfigManager = new ProfileConfigManager()
): Promise<Config> {
  const config = await configManager.getConfig(profile);

  if (!config) {
    const profiles = await configManager.listProfiles();
    const profileName = profile || profiles.find((p) => p.isDefault)?.name || 'default';
    throw new ConfigurationError(ERROR_MESSAGES.NO_CONFIG(profileName));
  }

  return config;
}

/**
 * Resolve which token to use based on tokenType and --as-bot flag.
 * Default: user token. Fallback to legacy `token` field for backward compatibility.
 */
export function resolveToken(
  config: Config,
  tokenType: TokenType,
  asBot = false
): string {
  // Explicit bot request
  if (tokenType === 'bot' || (tokenType === 'auto' && asBot)) {
    const token = config.botToken || config.token;
    if (!token) {
      throw new ConfigurationError(
        'Bot token is not configured. Run: slack-cli config set --bot-token YOUR_TOKEN'
      );
    }
    return token;
  }

  // Default: user token
  const token = config.userToken || config.token;
  if (!token) {
    throw new ConfigurationError(
      'User token is not configured. Run: slack-cli config set --user-token YOUR_TOKEN'
    );
  }
  return token;
}
