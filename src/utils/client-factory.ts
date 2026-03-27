import type { TokenType } from '../types/config';
import { getConfigOrThrow, resolveToken } from './config-helper';
import { SlackApiClient } from './slack-api-client';

/**
 * Creates a SlackApiClient instance with configuration from the specified profile.
 * Token is resolved based on tokenType and asBot flag.
 */
export async function createSlackClient(
  profile?: string,
  tokenType: TokenType = 'auto',
  asBot = false
): Promise<SlackApiClient> {
  const config = await getConfigOrThrow(profile);
  const token = resolveToken(config, tokenType, asBot);
  return new SlackApiClient(token);
}
