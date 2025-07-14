import twilio from 'twilio';

import { loadConfig } from './config';

const { Twilio } = twilio;

export async function createTwilioClient(credentials?: {
	accountSid: string;
	apiKey: string;
	apiSecret: string;
}) {
	const config = credentials ?? (await loadConfig());
	if (!config) {
		throw new Error('No Twilio credentials found');
	}

	return new Twilio(config.apiKey, config.apiSecret, {
		accountSid: config.accountSid,
	});
}
