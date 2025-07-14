import readline from 'node:readline';

import { loadConfigOrThrow } from '../config';
import { createTwilioClient } from '../twilio';

export async function grepCommand({
	pattern,
	message,
	multiple,
	recipient,
}: {
	pattern: string;
	message: string;
	multiple?: boolean;
	recipient?: string;
}) {
	const config = await loadConfigOrThrow();

	const compiledPattern = new RegExp(pattern);

	const targetRecipient = recipient ?? config.defaultRecipient;
	if (!targetRecipient) {
		throw new Error('No recipient found');
	}

	const client = await createTwilioClient();

	// Read line by line from stdin.
	const lines = readline.createInterface({
		input: process.stdin,
		crlfDelay: Infinity,
	});

	let hasSentMessage = false;

	for await (const line of lines) {
		if (!compiledPattern.test(line)) {
			continue;
		}

		if (multiple || !hasSentMessage) {
			hasSentMessage = true;
			await client.messages.create({
				body: message,
				from: config.outgoingPhoneNumber,
				to: targetRecipient,
			});
		}
	}
}
