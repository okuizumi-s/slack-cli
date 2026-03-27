import chalk from 'chalk';
import { Command } from 'commander';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseProfile } from '../utils/option-parsers';

export function setupDndCommand(): Command {
  const dndCommand = new Command('dnd').description('Manage Do Not Disturb settings');

  dndCommand
    .command('info')
    .description('Get DND status')
    .option('--user <userId>', 'User ID to check (defaults to self)')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { user?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile, 'user');
        const status = await client.getDndInfo(options.user);

        console.log(chalk.bold('DND Status:'));
        console.log(`  Enabled: ${status.dnd_enabled ? chalk.green('Yes') : chalk.gray('No')}`);
        if (status.snooze_enabled) {
          const remaining = Math.ceil((status.snooze_remaining || 0) / 60);
          console.log(`  Snooze: ${chalk.yellow(`${remaining} min remaining`)}`);
        }
        if (status.next_dnd_start_ts) {
          console.log(`  Next DND: ${chalk.gray(new Date(status.next_dnd_start_ts * 1000).toLocaleString())}`);
        }
      })
    );

  dndCommand
    .command('set')
    .description('Set snooze for N minutes')
    .requiredOption('-m, --minutes <minutes>', 'Number of minutes to snooze')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { minutes: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile, 'user');
        const numMinutes = parseInt(options.minutes, 10);
        if (isNaN(numMinutes) || numMinutes <= 0) {
          throw new Error('Minutes must be a positive number');
        }
        await client.setSnooze(numMinutes);
        console.log(chalk.green(`✓ Snooze set for ${numMinutes} minutes`));
      })
    );

  dndCommand
    .command('end')
    .description('End current snooze')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile, 'user');
        await client.endSnooze();
        console.log(chalk.green('✓ Snooze ended'));
      })
    );

  return dndCommand;
}
