import chalk from 'chalk';
import { Command } from 'commander';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseFormat, parseProfile } from '../utils/option-parsers';

export function setupSearchUsersCommand(): Command {
  const searchUsersCommand = new Command('search-users')
    .description('Search users in Slack workspace')
    .requiredOption('-q, --query <query>', 'Search query (name, email, title, etc.)')
    .option('--format <format>', 'Output format: simple, json', 'simple')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { query: string; format?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile, 'user');

        // Use users.list and filter client-side since search.users is not in @slack/web-api
        const allUsers = await client.listUsers();
        const query = options.query.toLowerCase();
        const matched = allUsers.filter((u) => {
          const name = (u.name || '').toLowerCase();
          const realName = (u.real_name || '').toLowerCase();
          const email = ((u as Record<string, unknown>).email as string || '').toLowerCase();
          const title = ((u.profile as Record<string, unknown>)?.title as string || '').toLowerCase();
          return name.includes(query) || realName.includes(query) || email.includes(query) || title.includes(query);
        });

        const format = parseFormat(options.format);

        if (format === 'json') {
          console.log(JSON.stringify(matched, null, 2));
          return;
        }

        console.log(chalk.bold(`Users matching "${options.query}" (${matched.length}):`));
        for (const user of matched) {
          const title = (user.profile as Record<string, unknown>)?.title || '';
          console.log(`  ${chalk.cyan(user.name)} - ${user.real_name || ''}${title ? ` (${title})` : ''}`);
        }
      })
    );

  return searchUsersCommand;
}
