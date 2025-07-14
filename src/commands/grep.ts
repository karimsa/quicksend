import { loadConfigOrThrow } from '../config';
import { createTwilioClient } from '../twilio';

export async function grepCommand({
	pattern,
	message,
	multiple,
	recipient,
	quiet,
}: {
	pattern: string;
	message: string;
	multiple?: boolean;
	recipient?: string;
	quiet?: boolean;
}) {
	const config = await loadConfigOrThrow();

	const compiledPattern = new RegExp(pattern);

	const targetRecipient = recipient ?? config.defaultRecipient;
	if (!targetRecipient) {
		throw new Error('No recipient found');
	}

	const client = await createTwilioClient();

	let hasSentMessage = false;

	for await (const chunk of process.stdin) {
		process.stdout.write(chunk);

		for (const line of chunk.toString().split('\n')) {
			if (compiledPattern.test(line) && (multiple || !hasSentMessage)) {
				hasSentMessage = true;
				await client.messages.create({
					body: message,
					from: config.outgoingPhoneNumber,
					to: targetRecipient,
				});

				if (!quiet) {
					console.log(`Sent message to ${targetRecipient}`);
				}
			}
		}
	}
}
