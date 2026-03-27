import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs/promises';
import { CanvasListOptions, CanvasReadOptions } from '../types/commands';
import { CanvasFile, CanvasSection, CanvasSectionElement } from '../types/slack';
import { createSlackClient } from '../utils/client-factory';
import { renderByFormat, withSlackClient } from '../utils/command-support';
import { wrapCommand } from '../utils/command-wrapper';
import { parseProfile } from '../utils/option-parsers';
import { sanitizeTerminalText } from '../utils/terminal-sanitizer';
import { createValidationHook, optionValidators } from '../utils/validators';

function extractText(elements: CanvasSectionElement[]): string {
  return elements
    .map((el) => {
      if (el.text) return sanitizeTerminalText(el.text);
      if (el.elements) return extractText(el.elements);
      return '';
    })
    .join('');
}

function formatSectionsTable(sections: CanvasSection[]): void {
  sections.forEach((section) => {
    const text = section.elements ? extractText(section.elements) : '';
    console.log(
      chalk.cyan(`ID: ${sanitizeTerminalText(section.id || '(no id)')}`) +
        `  Content: ${text || '(no content)'}`
    );
  });
}

function formatSectionsSimple(sections: CanvasSection[]): void {
  sections.forEach((section) => {
    const text = section.elements ? extractText(section.elements) : '';
    console.log(`${sanitizeTerminalText(section.id || '(no id)')}\t${text || '(no content)'}`);
  });
}

function formatCanvasesTable(canvases: CanvasFile[]): void {
  canvases.forEach((canvas) => {
    console.log(
      chalk.cyan(`ID: ${sanitizeTerminalText(canvas.id || '(no id)')}`) +
        `  Name: ${sanitizeTerminalText(canvas.name || '(no name)')}`
    );
  });
}

function formatCanvasesSimple(canvases: CanvasFile[]): void {
  canvases.forEach((canvas) => {
    console.log(
      `${sanitizeTerminalText(canvas.id || '(no id)')}\t${sanitizeTerminalText(canvas.name || '(no name)')}`
    );
  });
}

export function setupCanvasCommand(): Command {
  const canvasCommand = new Command('canvas').description('Manage Slack Canvases');

  const readCommand = new Command('read')
    .description('Get the sections of a Canvas')
    .requiredOption('-i, --id <canvas-id>', 'Canvas ID')
    .option('--format <format>', 'Output format: table, simple, json', 'table')
    .option('--profile <profile>', 'Use specific workspace profile')
    .hook('preAction', createValidationHook([optionValidators.format]))
    .action(
      wrapCommand(async (options: CanvasReadOptions) => {
        await withSlackClient(options, async (client) => {
          const sections = await client.readCanvas(options.id);

          if (sections.length === 0) {
            console.log('No sections found in canvas');
            return;
          }

          renderByFormat(options, sections, {
            table: formatSectionsTable,
            simple: formatSectionsSimple,
          });
        });
      })
    );

  const listCommand = new Command('list')
    .description('List canvases linked to a channel')
    .requiredOption('-c, --channel <channel>', 'Channel name or ID')
    .option('--format <format>', 'Output format: table, simple, json', 'table')
    .option('--profile <profile>', 'Use specific workspace profile')
    .hook('preAction', createValidationHook([optionValidators.format]))
    .action(
      wrapCommand(async (options: CanvasListOptions) => {
        await withSlackClient(options, async (client) => {
          const canvases = await client.listCanvases(options.channel);

          if (canvases.length === 0) {
            console.log('No canvases found in channel');
            return;
          }

          renderByFormat(options, canvases, {
            table: formatCanvasesTable,
            simple: formatCanvasesSimple,
          });
        });
      })
    );

  const createCommand = new Command('create')
    .description('Create a new canvas')
    .requiredOption('-t, --title <title>', 'Canvas title')
    .option('-m, --markdown <markdown>', 'Canvas content in markdown')
    .option('-f, --file <file>', 'File containing markdown content')
    .option('-c, --channel <channel>', 'Share to channel')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: {
        title: string;
        markdown?: string;
        file?: string;
        channel?: string;
        profile?: string;
      }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);

        let content: string | undefined;
        if (options.file) {
          content = await fs.readFile(options.file, 'utf-8');
        } else if (options.markdown) {
          content = options.markdown;
        }

        const canvasId = await client.createCanvas(options.title, content, options.channel);
        console.log(chalk.green(`✓ Canvas created: ${canvasId}`));
      })
    );

  const editCommand = new Command('edit')
    .description('Edit a canvas (append content)')
    .requiredOption('-i, --id <canvasId>', 'Canvas ID')
    .option('-m, --markdown <markdown>', 'Markdown content to append')
    .option('-f, --file <file>', 'File containing markdown content')
    .option('--operation <operation>', 'Operation: insert_at_end, insert_at_start, replace', 'insert_at_end')
    .option('--section <sectionId>', 'Section ID to target')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: {
        id: string;
        markdown?: string;
        file?: string;
        operation?: string;
        section?: string;
        profile?: string;
      }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);

        let content: string;
        if (options.file) {
          content = await fs.readFile(options.file, 'utf-8');
        } else if (options.markdown) {
          content = options.markdown;
        } else {
          throw new Error('Either --markdown or --file is required');
        }

        const operation = (options.operation || 'insert_at_end') as 'insert_at_end' | 'insert_at_start' | 'replace';
        await client.editCanvas(options.id, [{
          operation,
          document_content: { type: 'markdown', markdown: content },
          section_id: options.section,
        }]);
        console.log(chalk.green(`✓ Canvas ${options.id} updated`));
      })
    );

  const deleteCommand = new Command('delete')
    .description('Delete a canvas')
    .requiredOption('-i, --id <canvasId>', 'Canvas ID')
    .option('--profile <profile>', 'Use specific workspace profile')
    .action(
      wrapCommand(async (options: { id: string; profile?: string }) => {
        const profile = parseProfile(options.profile);
        const client = await createSlackClient(profile);
        await client.deleteCanvas(options.id);
        console.log(chalk.green(`✓ Canvas ${options.id} deleted`));
      })
    );

  canvasCommand.addCommand(readCommand);
  canvasCommand.addCommand(listCommand);
  canvasCommand.addCommand(createCommand);
  canvasCommand.addCommand(editCommand);
  canvasCommand.addCommand(deleteCommand);

  return canvasCommand;
}
