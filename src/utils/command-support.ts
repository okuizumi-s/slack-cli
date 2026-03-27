import type { TokenType } from '../types/config';
import { createSlackClient } from './client-factory';
import { parseFormat, parseProfile } from './option-parsers';
import { SlackApiClient } from './slack-api-client';
import { sanitizeTerminalData } from './terminal-sanitizer';

interface ProfileOption {
  profile?: string;
}

interface TokenOption {
  asBot?: boolean;
}

interface FormatOption {
  format?: string;
}

interface FormatRenderers<T> {
  table: (data: T) => void;
  simple?: (data: T) => void;
  json?: (data: T) => void;
}

/**
 * Creates a SlackApiClient and runs the action.
 * tokenType controls which token is used (default: 'auto' = user token, --as-bot for bot).
 */
export async function withSlackClient<TOptions extends ProfileOption & TokenOption, TResult>(
  options: TOptions,
  action: (client: SlackApiClient) => Promise<TResult>,
  tokenType: TokenType = 'auto'
): Promise<TResult> {
  const profile = parseProfile(options.profile);
  const asBot = options.asBot ?? false;
  const client = await createSlackClient(profile, tokenType, asBot);

  return await action(client);
}

export function renderByFormat<T>(
  options: FormatOption,
  data: T,
  renderers: FormatRenderers<T>
): void {
  const format = parseFormat(options.format);

  if (format === 'json') {
    if (renderers.json) {
      renderers.json(data);
      return;
    }

    console.log(JSON.stringify(sanitizeTerminalData(data), null, 2));
    return;
  }

  if (format === 'simple' && renderers.simple) {
    renderers.simple(data);
    return;
  }

  renderers.table(data);
}
