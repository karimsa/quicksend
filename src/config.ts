import { z } from 'zod';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const configSchema = z.object({
	accountSid: z.string(),
	apiKey: z.string(),
	apiSecret: z.string(),
	outgoingPhoneNumber: z.string().optional(),
	defaultRecipient: z.string().optional(),
});

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && 'code' in error;
}

const configFilePath = path.join(process.env.HOME!, '.quicksend.json');

export async function loadConfig() {
	try {
		const text = await fs.readFile(configFilePath, 'utf8');
		const config = configSchema.parse(JSON.parse(text));
		return config;
	} catch (error) {
		if (isNodeError(error) && error.code === 'ENOENT') {
			return null;
		}

		throw error;
	}
}

export async function loadConfigOrThrow() {
	const config = await loadConfig();
	if (!config) {
		throw new Error('No config found - have you run `quicksend init`?');
	}
	if (!config.outgoingPhoneNumber) {
		throw new Error(
			'No outgoing phone number found - have you run `quicksend init`?',
		);
	}
	return config;
}

export async function updateConfig(config: z.infer<typeof configSchema>) {
	const validatedConfig = configSchema.parse(config);
	const text = JSON.stringify(validatedConfig, null, 2);
	await fs.writeFile(configFilePath, text);
}
