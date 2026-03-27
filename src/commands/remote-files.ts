import chalk from 'chalk';
import { Command } from 'commander';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseFormat, parseProfile } from '../utils/option-parsers';

export function setupRemoteFilesCommand(): Command {
  const remoteFilesCommand = new Command('remote-files').description('Manage remote files');

  remoteFilesCommand
    .command('list')
    .description('List remote files')
    .option('-c, --channel <channel>', 'Filter by channel')
    .option('--format <format>', 'Output format: simple, json', 'simple')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { channel?: string; format?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        const files = await client.listRemoteFiles(options.channel);
        const format = parseFormat(options.format);

        if (format === 'json') {
          console.log(JSON.stringify(files, null, 2));
          return;
        }

        console.log(chalk.bold(`Remote Files (${files.length}):`));
        for (const file of files) {
          console.log(`  ${chalk.cyan(file.title)} (${file.external_type}) [${file.id}]`);
          console.log(`    ${chalk.gray(file.external_url)}`);
        }
      })
    );

  remoteFilesCommand
    .command('info')
    .description('Get remote file info')
    .option('-f, --file <fileId>', 'File ID')
    .option('--external-id <externalId>', 'External ID')
    .option('--format <format>', 'Output format: simple, json', 'simple')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { file?: string; externalId?: string; format?: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        const file = await client.getRemoteFileInfo(options.file, options.externalId);

        if (options.format === 'json') {
          console.log(JSON.stringify(file, null, 2));
          return;
        }

        console.log(chalk.bold('Remote File:'));
        console.log(`  ID: ${file.id}`);
        console.log(`  Title: ${file.title}`);
        console.log(`  Type: ${file.external_type}`);
        console.log(`  URL: ${chalk.cyan(file.external_url)}`);
      })
    );

  remoteFilesCommand
    .command('share')
    .description('Share a remote file to channels')
    .requiredOption('-f, --file <fileId>', 'File ID')
    .requiredOption('-c, --channels <channels>', 'Comma-separated channel IDs')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { file: string; channels: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        await client.shareRemoteFile(options.file, options.channels.split(','));
        console.log(chalk.green(`✓ Remote file shared`));
      })
    );

  return remoteFilesCommand;
}
