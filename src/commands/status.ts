import chalk from 'chalk';
import { Command } from 'commander';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseProfile } from '../utils/option-parsers';

export function setupStatusCommand(): Command {
  const statusCommand = new Command('status').description('Manage user status');

  statusCommand
    .command('get')
    .description('Get current status')
    .option('--user <userId>', 'User ID (defaults to self)')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { user?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile, 'user');
        const userProfile = await client.getStatus(options.user);

        console.log(chalk.bold('Status:'));
        if (userProfile.status_emoji || userProfile.status_text) {
          console.log(`  ${userProfile.status_emoji || ''} ${userProfile.status_text || ''}`);
          if (userProfile.status_expiration) {
            console.log(`  Expires: ${chalk.gray(new Date(userProfile.status_expiration * 1000).toLocaleString())}`);
          }
        } else {
          console.log(chalk.gray('  No status set'));
        }
        if (userProfile.display_name) {
          console.log(`  Display Name: ${userProfile.display_name}`);
        }
        if (userProfile.title) {
          console.log(`  Title: ${userProfile.title}`);
        }
      })
    );

  statusCommand
    .command('set')
    .description('Set your status')
    .requiredOption('-t, --text <text>', 'Status text')
    .option('-e, --emoji <emoji>', 'Status emoji (e.g. :house:)')
    .option('--until <minutes>', 'Clear status after N minutes')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { text: string; emoji?: string; until?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile, 'user');

        let expiration: number | undefined;
        if (options.until) {
          const minutes = parseInt(options.until, 10);
          if (isNaN(minutes) || minutes <= 0) {
            throw new Error('Minutes must be a positive number');
          }
          expiration = Math.floor(Date.now() / 1000) + minutes * 60;
        }

        await client.setStatus(options.text, options.emoji, expiration);
        const display = `${options.emoji || ''} ${options.text}`.trim();
        console.log(chalk.green(`✓ Status set: ${display}`));
      })
    );

  statusCommand
    .command('clear')
    .description('Clear your status')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile, 'user');
        await client.clearStatus();
        console.log(chalk.green('✓ Status cleared'));
      })
    );

  return statusCommand;
}
