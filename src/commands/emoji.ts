import chalk from 'chalk';
import { Command } from 'commander';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseFormat, parseProfile } from '../utils/option-parsers';

export function setupEmojiCommand(): Command {
  const emojiCommand = new Command('emoji')
    .description('List custom emoji in workspace')
    .option('--format <format>', 'Output format: table, simple, json', 'simple')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { format?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        const emojis = await client.listEmoji();
        const format = parseFormat(options.format);

        if (format === 'json') {
          console.log(JSON.stringify(emojis, null, 2));
          return;
        }

        const entries = Object.entries(emojis);
        console.log(chalk.bold(`Custom Emoji (${entries.length}):`));
        for (const [name, url] of entries) {
          if (url.startsWith('alias:')) {
            console.log(`  :${name}: → ${chalk.gray(url)}`);
          } else {
            console.log(`  :${name}:`);
          }
        }
      })
    );

  return emojiCommand;
}
