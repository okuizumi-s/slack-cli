import chalk from 'chalk';
import { Command } from 'commander';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseProfile } from '../utils/option-parsers';

export function setupCallsCommand(): Command {
  const callsCommand = new Command('calls').description('Get call information');

  callsCommand
    .command('info')
    .description('Get information about a call')
    .requiredOption('-i, --id <callId>', 'Call ID')
    .option('--format <format>', 'Output format: simple, json', 'simple')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { id: string; format?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        const call = await client.getCallInfo(options.id);

        if (options.format === 'json') {
          console.log(JSON.stringify(call, null, 2));
          return;
        }

        console.log(chalk.bold('Call Info:'));
        console.log(`  ID: ${call.id}`);
        if (call.title) console.log(`  Title: ${call.title}`);
        console.log(`  Started: ${new Date(call.date_start * 1000).toLocaleString()}`);
        if (call.date_end) console.log(`  Ended: ${new Date(call.date_end * 1000).toLocaleString()}`);
        if (call.join_url) console.log(`  Join: ${chalk.cyan(call.join_url)}`);
      })
    );

  return callsCommand;
}
