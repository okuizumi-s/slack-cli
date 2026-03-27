import chalk from 'chalk';
import { Command } from 'commander';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseFormat, parseProfile } from '../utils/option-parsers';

export function setupUsergroupCommand(): Command {
  const usergroupCommand = new Command('usergroup').description('Manage user groups');

  usergroupCommand
    .command('list')
    .description('List user groups')
    .option('--include-disabled', 'Include disabled user groups')
    .option('--format <format>', 'Output format: table, simple, json', 'simple')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { includeDisabled?: boolean; format?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        const groups = await client.listUsergroups(options.includeDisabled);
        const format = parseFormat(options.format);

        if (format === 'json') {
          console.log(JSON.stringify(groups, null, 2));
          return;
        }

        console.log(chalk.bold(`User Groups (${groups.length}):`));
        for (const group of groups) {
          console.log(`  @${chalk.cyan(group.handle)} - ${group.name} (${group.user_count} members)`);
        }
      })
    );

  usergroupCommand
    .command('members')
    .description('List members of a user group')
    .requiredOption('-g, --group <groupId>', 'User group ID')
    .option('--format <format>', 'Output format: table, simple, json', 'simple')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { group: string; format?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        const memberIds = await client.listUsergroupMembers(options.group);
        const format = parseFormat(options.format);

        if (format === 'json') {
          console.log(JSON.stringify(memberIds, null, 2));
          return;
        }

        console.log(chalk.bold(`Members (${memberIds.length}):`));
        for (const id of memberIds) {
          try {
            const user = await client.getUserInfo(id);
            console.log(`  ${chalk.cyan(user.name)} (${user.real_name || id})`);
          } catch {
            console.log(`  ${id}`);
          }
        }
      })
    );

  usergroupCommand
    .command('create')
    .description('Create a user group')
    .requiredOption('-n, --name <name>', 'Group name')
    .requiredOption('--handle <handle>', 'Group handle (mention name)')
    .option('-d, --description <description>', 'Group description')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { name: string; handle: string; description?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        const group = await client.createUsergroup(options.name, options.handle, options.description);
        console.log(chalk.green(`✓ User group created: @${group.handle} (${group.id})`));
      })
    );

  usergroupCommand
    .command('update')
    .description('Update a user group')
    .requiredOption('-g, --group <groupId>', 'User group ID')
    .option('-n, --name <name>', 'New group name')
    .option('--handle <handle>', 'New group handle')
    .option('-d, --description <description>', 'New description')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { group: string; name?: string; handle?: string; description?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        await client.updateUsergroup(options.group, {
          name: options.name,
          handle: options.handle,
          description: options.description,
        });
        console.log(chalk.green(`✓ User group ${options.group} updated`));
      })
    );

  usergroupCommand
    .command('disable')
    .description('Disable a user group')
    .requiredOption('-g, --group <groupId>', 'User group ID')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { group: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        await client.disableUsergroup(options.group);
        console.log(chalk.green(`✓ User group ${options.group} disabled`));
      })
    );

  usergroupCommand
    .command('enable')
    .description('Enable a user group')
    .requiredOption('-g, --group <groupId>', 'User group ID')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { group: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        await client.enableUsergroup(options.group);
        console.log(chalk.green(`✓ User group ${options.group} enabled`));
      })
    );

  return usergroupCommand;
}
