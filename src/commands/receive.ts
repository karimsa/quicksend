import { loadConfigOrThrow } from '../config';
import { createTwilioClient } from '../twilio';

export async function receiveCommand({ quiet }: { quiet?: boolean }) {
	const config = await loadConfigOrThrow();

	const client = await createTwilioClient();

	const listenStart = new Date();

	do {
		const messages = await client.messages.list({
			to: config.outgoingPhoneNumber,
			dateSentAfter: listenStart,
			limit: 1,
		});
		const firstMessage = messages[0];

		if (!firstMessage) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			continue;
		}

		if (!quiet) {
			console.log(firstMessage.body);
		}

		break;
	} while (true);
}
