import { appendFile } from 'node:fs/promises';

import { loadConfigOrThrow } from '../config';
import { createTwilioClient } from '../twilio';

export async function receiveCommand({
	quiet,
	follow,
	output,
}: {
	quiet?: boolean;
	follow?: boolean;
	output?: string;
}) {
	const config = await loadConfigOrThrow();

	const client = await createTwilioClient();

	const listenStart = new Date();
	const received = new Set<string>();

	do {
		const messages = await client.messages.list({
			to: config.outgoingPhoneNumber,
			dateSentAfter: listenStart,
			limit: follow ? undefined : 1,
		});

		messages.sort((a, b) => a.dateCreated.getTime() - b.dateCreated.getTime());
		for (const message of messages) {
			if (received.has(message.sid)) continue;
			if (output !== undefined) {
				await appendFile(output, `${JSON.stringify(message)}\n`, 'utf8');
			}
			received.add(message.sid);

			if (!quiet) {
				console.log(message.body);
			}

			if (!follow) return;
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
	} while (true);
}
