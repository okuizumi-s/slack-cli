import chalk from 'chalk';
import { Command } from 'commander';
import { EditOptions } from '../types/commands';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseProfile } from '../utils/option-parsers';
import { createValidationHook, optionValidators } from '../utils/validators';

export function setupEditCommand(): Command {
  const editCommand = new Command('edit')
    .description('Edit a sent message')
    .requiredOption('-c, --channel <channel>', 'Channel name or ID')
    .requiredOption('--ts <timestamp>', 'Message timestamp to edit')
    .requiredOption('-m, --message <message>', 'New message text')
    .option('--blocks <blocks>', 'JSON array of Block Kit blocks')
    .option('--profile <profile>', 'Use specific workspace profile')
    .hook('preAction', createValidationHook([optionValidators.editTimestamp]))
    .action(
      wrapCommand(async (options: EditOptions) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);

        const blocks = options.blocks ? JSON.parse(options.blocks) : undefined;
        await client.updateMessage(options.channel, options.ts, options.message, blocks);
        console.log(chalk.green(`✓ Message updated successfully in #${options.channel}`));
      })
    );

  return editCommand;
}
