import chalk from 'chalk';
import { Command } from 'commander';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseFormat, parseProfile } from '../utils/option-parsers';

export function setupListsCommand(): Command {
  const listsCommand = new Command('lists').description('Manage Slack Lists');

  listsCommand
    .command('list')
    .description('List all lists')
    .option('--format <format>', 'Output format: simple, json', 'simple')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { format?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile, 'user');
        const lists = await client.listLists();
        const format = parseFormat(options.format);

        if (format === 'json') {
          console.log(JSON.stringify(lists, null, 2));
          return;
        }

        console.log(chalk.bold(`Lists (${lists.length}):`));
        for (const list of lists) {
          console.log(`  ${chalk.cyan(list.title)} [${list.id}]`);
          if (list.description) console.log(`    ${chalk.gray(list.description)}`);
        }
      })
    );

  listsCommand
    .command('create')
    .description('Create a new list')
    .requiredOption('-t, --title <title>', 'List title')
    .option('-d, --description <description>', 'List description')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { title: string; description?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile, 'user');
        const listId = await client.createList(options.title, options.description);
        console.log(chalk.green(`✓ List created: ${listId}`));
      })
    );

  listsCommand
    .command('delete')
    .description('Delete a list')
    .requiredOption('-i, --id <listId>', 'List ID')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { id: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile, 'user');
        await client.deleteList(options.id);
        console.log(chalk.green(`✓ List ${options.id} deleted`));
      })
    );

  return listsCommand;
}
