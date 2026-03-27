import chalk from 'chalk';
import { Command } from 'commander';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseFormat, parseProfile } from '../utils/option-parsers';

export function setupFilesCommand(): Command {
  const filesCommand = new Command('files').description('Manage files');

  filesCommand
    .command('list')
    .description('List files')
    .option('-c, --channel <channel>', 'Filter by channel')
    .option('--user <userId>', 'Filter by user')
    .option('-n, --number <count>', 'Number of results (default: 20)')
    .option('--page <page>', 'Page number')
    .option('--types <types>', 'Filter by type (e.g. images, pdfs, documents)')
    .option('--format <format>', 'Output format: table, simple, json', 'simple')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: {
        channel?: string;
        user?: string;
        number?: string;
        page?: string;
        types?: string;
        format?: string;
        profile?: string;
      }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        const result = await client.listFiles({
          channel: options.channel,
          user: options.user,
          count: options.number ? parseInt(options.number, 10) : 20,
          page: options.page ? parseInt(options.page, 10) : undefined,
          types: options.types,
        });
        const format = parseFormat(options.format);

        if (format === 'json') {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log(chalk.bold(`Files (${result.paging.total} total, page ${result.paging.page}/${result.paging.pages}):`));
        for (const file of result.files) {
          const size = file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(1)}MB`
            : `${(file.size / 1024).toFixed(1)}KB`;
          const date = new Date(file.created * 1000).toLocaleDateString();
          console.log(`  ${chalk.cyan(file.name)} (${size}) - ${chalk.gray(date)} [${file.id}]`);
        }
      })
    );

  filesCommand
    .command('download')
    .description('Download a file')
    .requiredOption('-f, --file <fileId>', 'File ID to download')
    .option('-o, --output <dir>', 'Output directory (default: current directory)', '.')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { file: string; output: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        const outputPath = await client.downloadFile(options.file, options.output);
        console.log(chalk.green(`✓ Downloaded to ${outputPath}`));
      })
    );

  filesCommand
    .command('delete')
    .description('Delete a file')
    .requiredOption('-f, --file <fileId>', 'File ID to delete')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { file: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        await client.deleteFile(options.file);
        console.log(chalk.green(`✓ File ${options.file} deleted`));
      })
    );

  return filesCommand;
}
