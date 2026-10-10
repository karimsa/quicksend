#!/usr/bin/env node

import { program } from 'commander';

import { version } from '../package.json';
import { initCommand } from './commands/init';
import { sendCommand } from './commands/send';
import { receiveCommand } from './commands/receive';

program.version(version);

program
	.command('init')
	.description('Initialize config file (required to do anything else)')
	.action(initCommand);

program
	.command('send')
	.description('Sends a message')
	.requiredOption('-m, --message <message>', 'The message text to send')
	.option(
		'-r, --recipient <recipient>',
		'The recipient phone number (default: from config)',
	)
	.option('-q, --quiet', "Don't show any output")
	.action(sendCommand);

program
	.command('receive')
	.description('Receives incoming messages')
	.option('--follow', 'Continue receiving messages until interrupted')
	.option('--output <file>', 'Append received messages to a JSONL file')
	.option('-q, --quiet', "Don't show any output")
	.action(receiveCommand);

program.parse();
