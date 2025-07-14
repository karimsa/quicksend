import { loadConfigOrThrow } from '../config';
import { createTwilioClient } from '../twilio';

export async function sendCommand({
	message,
	recipient,
	quiet,
}: {
	message: string;
	recipient?: string;
	quiet?: boolean;
}) {
	const config = await loadConfigOrThrow();

	const client = await createTwilioClient();

	const targetRecipient = recipient ?? config.defaultRecipient;
	if (!targetRecipient) {
		throw new Error('No recipient found');
	}

	await client.messages.create({
		body: message,
		from: config.outgoingPhoneNumber,
		to: targetRecipient,
	});

	if (!quiet) {
		console.log(`Sent text message to ${targetRecipient}`);
	}
}
