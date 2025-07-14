import prompts from 'prompts';

import { loadConfig, updateConfig } from '../config';
import { createTwilioClient } from '../twilio';

export async function initCommand() {
	const config = await loadConfig();

	//
	// First, we need access to Twilio's API. So get the user to provide the account SID, API key, and API secret.
	//

	console.log('');
	console.log(
		'🔑  Generate a new API key pair at: https://www.twilio.com/console/runtime/api-keys',
	);
	console.log('');

	const updatedApiCredentials = await prompts([
		{
			type: 'text',
			name: 'accountSid',
			message: 'Account SID',
			initial: config?.accountSid,
			validate: (value) => {
				if (!String(value).startsWith('AC')) {
					return 'This is located at the bottom of the page, as "Account SID" (NOT API Key SID).';
				}

				return true;
			},
		},
		{
			type: 'text',
			name: 'apiKey',
			message: 'API Key SID',
			initial: config?.apiKey,
			validate: (value) => {
				if (!String(value).startsWith('SK')) {
					return 'Invalid api key: your api key should start with "SK"';
				}

				return true;
			},
		},
		{
			type: 'password',
			name: 'apiSecret',
			message: 'API Key Secret',
			initial: config?.apiSecret,
			validate: (value) => {
				if (!value) {
					return 'Invalid api secret: your api secret should be a string';
				}

				return true;
			},
		},
	]);

	if (!updatedApiCredentials.accountSid || !updatedApiCredentials.apiKey) {
		process.exit(1);
	}

	{
		const client = await createTwilioClient({
			accountSid: updatedApiCredentials.accountSid,
			apiKey: updatedApiCredentials.apiKey,
			apiSecret: updatedApiCredentials.apiSecret,
		});

		// list phone numbers
		try {
			await client.incomingPhoneNumbers.list();
		} catch (error) {
			throw new Error(
				`Failed to reach Twilio API. Please check your credentials.`,
				{ cause: error },
			);
		}
	}

	await updateConfig({
		accountSid: updatedApiCredentials.accountSid,
		apiKey: updatedApiCredentials.apiKey,
		apiSecret: updatedApiCredentials.apiSecret,
	});

	//
	// Next, we need a phone number that we can use to send messages.
	//
	// We don't handle leasing in the CLI, since there are some regulatory requirements depending on your country.
	// So we will just wait for the user to handle leasing in the console, and then we can let them select the phone number from their leased numbers.
	//

	const client = await createTwilioClient({
		accountSid: updatedApiCredentials.accountSid,
		apiKey: updatedApiCredentials.apiKey,
		apiSecret: updatedApiCredentials.apiSecret,
	});

	{
		const phoneNumbers = await client.incomingPhoneNumbers.list();

		if (phoneNumbers.length === 0) {
			console.log(`No phone numbers found. You will need to lease one.`);
			console.log('');
			console.log(
				`Console: https://console.twilio.com/us1/develop/phone-numbers/manage/search`,
			);
			console.log('');
			console.log('Waiting for phone number to be leased ...');

			do {
				const phoneNumbers = await client.incomingPhoneNumbers.list();
				if (phoneNumbers.length > 0) {
					break;
				}

				await new Promise((resolve) => setTimeout(resolve, 1000));
			} while (true);
		}
	}

	const phoneNumbers = await client.incomingPhoneNumbers.list();

	const selectedPhoneNumber = await prompts([
		{
			type: 'select',
			name: 'phoneNumber',
			message: 'Select a phone number',
			initial: config?.outgoingPhoneNumber,
			choices: phoneNumbers.map((phoneNumber) => ({
				title: phoneNumber.phoneNumber,
				value: phoneNumber.phoneNumber,
			})),
			validate: (value) => {
				if (!value) {
					return 'Please select a phone number';
				}

				return true;
			},
		},
	]);

	await updateConfig({
		accountSid: updatedApiCredentials.accountSid,
		apiKey: updatedApiCredentials.apiKey,
		apiSecret: updatedApiCredentials.apiSecret,
		outgoingPhoneNumber: selectedPhoneNumber.phoneNumber,
	});

	//
	// Next, we need a default recipient. This is optional, but honestly makes it really cumbersome to use the CLI without it.
	//

	const defaultRecipient = await prompts([
		{
			type: 'text',
			name: 'defaultRecipient',
			message: 'Default recipient (your cell phone number)',
			initial: config?.defaultRecipient,
		},
	]);

	await updateConfig({
		accountSid: updatedApiCredentials.accountSid,
		apiKey: updatedApiCredentials.apiKey,
		apiSecret: updatedApiCredentials.apiSecret,
		outgoingPhoneNumber: selectedPhoneNumber.phoneNumber,
		defaultRecipient: defaultRecipient.defaultRecipient,
	});

	//
	// Send a test message.
	//

	{
		const config = await loadConfig();
		if (!config) {
			throw new Error('No config found');
		}

		if (!config.defaultRecipient) {
			throw new Error('No default recipient found');
		}

		await client.messages.create({
			body: 'Hello from quicksend!',
			from: config.outgoingPhoneNumber,
			to: config.defaultRecipient,
		});

		console.log(`Sent text message to your phone!`);
	}
}
