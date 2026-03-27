import chalk from 'chalk';
import { Command } from 'commander';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { parseFormat, parseProfile } from '../utils/option-parsers';

export function setupSearchFilesCommand(): Command {
  const searchFilesCommand = new Command('search-files')
    .description('Search files in Slack workspace')
    .requiredOption('-q, --query <query>', 'Search query')
    .option('--sort <sort>', 'Sort by: score or timestamp', 'score')
    .option('--sort-dir <direction>', 'Sort direction: asc or desc', 'desc')
    .option('-n, --number <count>', 'Number of results (default: 20)')
    .option('--page <page>', 'Page number')
    .option('--format <format>', 'Output format: simple, json', 'simple')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: {
        query: string;
        sort?: string;
        sortDir?: string;
        number?: string;
        page?: string;
        format?: string;
        profile?: string;
      }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile, 'user');
        const result = await client.searchFiles(options.query, {
          sort: (options.sort as 'score' | 'timestamp') || 'score',
          sortDir: (options.sortDir as 'asc' | 'desc') || 'desc',
          count: options.number ? parseInt(options.number, 10) : 20,
          page: options.page ? parseInt(options.page, 10) : 1,
        });
        const format = parseFormat(options.format);

        if (format === 'json') {
          console.log(JSON.stringify(result, null, 2));
          return;
        }

        console.log(chalk.bold(`File Search Results (${result.totalCount} total, page ${result.page}/${result.pageCount}):`));
        for (const file of result.files) {
          console.log(`  ${chalk.cyan(file.name)} (${file.filetype}) [${file.id}]`);
          if (file.permalink) console.log(`    ${chalk.gray(file.permalink)}`);
        }
      })
    );

  return searchFilesCommand;
}
