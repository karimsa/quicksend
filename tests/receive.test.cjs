const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { readFileSync, mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const compiled = ts.transpileModule(
	readFileSync('src/commands/receive.ts', 'utf8'),
	{ compilerOptions: { module: ts.ModuleKind.CommonJS } },
).outputText;

function loadReceive(source, list, log, sleep) {
	const entry = {};
	const imports = {
		'node:fs/promises': require('node:fs/promises'),
		'../config': {
			loadConfigOrThrow: async () => ({ outgoingPhoneNumber: '+15551234567' }),
		},
		'../twilio': {
			createTwilioClient: async () => ({ messages: { list } }),
		},
	};
	new Function('require', 'exports', 'console', 'setTimeout', source)(
		(name) => imports[name],
		entry,
		{ log },
		sleep,
	);
	return entry.receiveCommand;
}

const finished = new Error('End of polling fixture');

function fixture(batches, body = (id) => `Message ${id}`) {
	const output = [];
	let polls = 0;
	const receive = loadReceive(
		compiled,
		async ({ to, dateSentAfter, limit }) => {
			assert.equal(to, '+15551234567');
			assert.ok(dateSentAfter instanceof Date);
			if (polls === batches.length) throw finished;
			const messages = batches[polls++].map((id) => ({
				sid: `SM${id}`,
				body: body(id),
				dateCreated: new Date(dateSentAfter.getTime() + id * 1000),
			}));
			return limit === undefined ? messages : messages.slice(0, limit);
		},
		(body) => output.push(body),
		(resolve) => setImmediate(resolve),
	);
	return { receive, output, polls: () => polls };
}

test('default receive waits for a message and exits after printing one', async () => {
	const run = fixture([[], [2, 1], [3]]);
	await run.receive({});
	assert.deepEqual(run.output, ['Message 2']);
	assert.equal(run.polls(), 2);
});

test('follow prints bursts in order and skips previously received messages', async () => {
	const run = fixture([[], [3, 2, 1], [3, 2, 1], [5, 4, 3, 2, 1]]);
	await assert.rejects(
		run.receive({ follow: true }),
		(error) => error === finished,
	);
	assert.deepEqual(
		run.output,
		[1, 2, 3, 4, 5].map((id) => `Message ${id}`),
	);
});

test('quiet suppresses output in both receive modes', async () => {
	const single = fixture([[1]]);
	await single.receive({ quiet: true });
	assert.deepEqual(single.output, []);
	const follow = fixture([[1], [2, 1]]);
	await assert.rejects(
		follow.receive({ quiet: true, follow: true }),
		(error) => error === finished,
	);
	assert.equal(follow.polls(), 2);
	assert.deepEqual(follow.output, []);
});

function outputFile(t) {
	const directory = mkdtempSync(join(tmpdir(), 'quicksend-test-'));
	t.after(() => rmSync(directory, { recursive: true, force: true }));
	return join(directory, 'messages.jsonl');
}

for (const follow of [false, true]) {
	for (const quiet of [false, true]) {
		test(`output appends JSONL with follow=${follow}, quiet=${quiet}`, async (t) => {
			const file = outputFile(t);
			const previous = '{"body":"previous message"}\n';
			writeFileSync(file, previous);
			const body = (id) => `Message ${id}\n"hello" 👋`;
			const run = fixture([[1], [2, 1], [2, 1]], body);
			if (follow) {
				await assert.rejects(
					run.receive({ follow, quiet, output: file }),
					(error) => error === finished,
				);
			} else {
				await run.receive({ quiet, output: file });
			}
			const contents = readFileSync(file, 'utf8');
			assert.ok(contents.startsWith(previous));
			assert.ok(contents.endsWith('\n'));
			const records = contents
				.trimEnd()
				.split('\n')
				.map((line) => JSON.parse(line));
			const ids = follow ? [1, 2] : [1];
			assert.deepEqual(
				records.slice(1).map((record) => record.sid),
				ids.map((id) => `SM${id}`),
			);
			assert.deepEqual(
				records.slice(1).map((record) => record.body),
				ids.map(body),
			);
			assert.ok(
				records
					.slice(1)
					.every((record) => Number.isFinite(Date.parse(record.dateCreated))),
			);
			assert.deepEqual(run.output, quiet ? [] : ids.map(body));
		});
	}
}

test('output creates a missing file', async (t) => {
	const file = outputFile(t);
	await fixture([[1]]).receive({ output: file });
	assert.equal(JSON.parse(readFileSync(file, 'utf8')).sid, 'SM1');
});

test('output serializes a Twilio message with public metadata', async (t) => {
	const {
		MessageInstance,
	} = require('twilio/lib/rest/api/v2010/account/message');
	const message = new MessageInstance(
		{},
		{
			sid: 'SM123',
			body: 'Hello\nworld',
			from: '+15557654321',
			to: '+15551234567',
			date_created: 'Sat, 10 Oct 2026 12:00:00 +0000',
			date_sent: 'Sat, 10 Oct 2026 12:00:00 +0000',
			status: 'received',
		},
		'AC123',
	);
	const file = outputFile(t);
	const receive = loadReceive(
		compiled,
		async () => [message],
		() => {},
		setTimeout,
	);
	await receive({ output: file });
	const record = JSON.parse(readFileSync(file, 'utf8'));
	assert.equal(record.sid, 'SM123');
	assert.equal(record.body, 'Hello\nworld');
	assert.equal(record.from, '+15557654321');
	assert.equal(record.to, '+15551234567');
	assert.equal(record.status, 'received');
	assert.equal(record.dateSent, '2026-10-10T12:00:00.000Z');
	assert.equal('_version' in record, false);
	assert.equal('_solution' in record, false);
});

test('output rejects file errors without reporting the message on stdout', async (t) => {
	const run = fixture([[1]]);
	await assert.rejects(
		run.receive({ output: join(outputFile(t), 'missing.jsonl') }),
		{ code: 'ENOENT' },
	);
	assert.deepEqual(run.output, []);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
	test(`follow terminates on ${signal}`, { timeout: 5000 }, async (t) => {
		const child = spawn(process.execPath, [
			'-e',
			`
			const receive = (${loadReceive.toString()})(
				${JSON.stringify(compiled)},
				async () => [{ sid: 'SM1', body: 'ready', dateCreated: new Date() }],
				console.log,
				setTimeout,
			);
			receive({ follow: true }).catch(() => process.exit(1));
		`,
		]);
		t.after(() => {
			if (child.exitCode === null) child.kill('SIGKILL');
		});
		const exited = once(child, 'exit');
		await once(child.stdout, 'data');
		child.kill(signal);
		const [code, terminationSignal] = await exited;
		assert.equal(code, null);
		assert.equal(terminationSignal, signal);
	});
}
