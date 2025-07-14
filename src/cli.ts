#!/usr/bin/env node

import { program } from 'commander';

import { version } from '../package.json';
import { initCommand } from './commands/init';
import { grepCommand } from './commands/grep';
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
	.command('grep')
	.description('Sends a message when a pattern matches stdin')
	.requiredOption('-p, --pattern <pattern>', 'The pattern to match')
	.requiredOption(
		'-m, --message <message>',
		'The message to send when pattern matches',
	)
	.option(
		'-x, --multiple',
		'If multiple is passed, sends a message for every match',
	)
	.option('-q, --quiet', "Don't show any output")
	.action(grepCommand);

program
	.command('receive')
	.description('Receives a single message')
	.option('-q, --quiet', "Don't show any output")
	.action(receiveCommand);

program.parse();
