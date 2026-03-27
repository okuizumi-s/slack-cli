import chalk from 'chalk';
import { Command } from 'commander';
import { ReactionOptions } from '../types/commands';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseProfile } from '../utils/option-parsers';
import { createValidationHook, optionValidators } from '../utils/validators';

export function setupReactionCommand(): Command {
  const reactionCommand = new Command('reaction').description(
    'Add or remove emoji reactions on messages'
  );

  const addCommand = new Command('add')
    .description('Add a reaction to a message')
    .requiredOption('-c, --channel <channel>', 'Channel name or ID')
    .requiredOption('-t, --timestamp <timestamp>', 'Message timestamp')
    .requiredOption('-e, --emoji <emoji>', 'Emoji name (without colons)')
    .option('--profile <profile>', 'Use specific workspace profile')
    .hook('preAction', createValidationHook([optionValidators.reactionTimestamp]))
    .action(
      wrapCommand(async (options: ReactionOptions) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);

        await client.addReaction(options.channel, options.timestamp, options.emoji);
        console.log(
          chalk.green(`✓ Reaction :${options.emoji}: added to message in #${options.channel}`)
        );
      })
    );

  const removeCommand = new Command('remove')
    .description('Remove a reaction from a message')
    .requiredOption('-c, --channel <channel>', 'Channel name or ID')
    .requiredOption('-t, --timestamp <timestamp>', 'Message timestamp')
    .requiredOption('-e, --emoji <emoji>', 'Emoji name (without colons)')
    .option('--profile <profile>', 'Use specific workspace profile')
    .hook('preAction', createValidationHook([optionValidators.reactionTimestamp]))
    .action(
      wrapCommand(async (options: ReactionOptions) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);

        await client.removeReaction(options.channel, options.timestamp, options.emoji);
        console.log(
          chalk.green(`✓ Reaction :${options.emoji}: removed from message in #${options.channel}`)
        );
      })
    );

  const listCommand = new Command('list')
    .description('List reactions on a message')
    .requiredOption('-c, --channel <channel>', 'Channel name or ID')
    .requiredOption('-t, --timestamp <timestamp>', 'Message timestamp')
    .option('--format <format>', 'Output format: simple, json', 'simple')
    .option('--profile <profile>', 'Use specific workspace profile')
    .hook('preAction', createValidationHook([optionValidators.reactionTimestamp]))
    .action(
      wrapCommand(async (options: ReactionOptions & { format?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        const reactions = await client.listReactions(options.channel, options.timestamp);

        if (options.format === 'json') {
          console.log(JSON.stringify(reactions, null, 2));
          return;
        }

        if (reactions.length === 0) {
          console.log(chalk.gray('No reactions on this message'));
          return;
        }

        console.log(chalk.bold('Reactions:'));
        for (const r of reactions) {
          console.log(`  :${r.name}: × ${r.count} (${r.users.length} users)`);
        }
      })
    );

  reactionCommand.addCommand(addCommand);
  reactionCommand.addCommand(removeCommand);
  reactionCommand.addCommand(listCommand);

  return reactionCommand;
}
