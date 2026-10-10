# quicksend

Text yourself from your terminal. Get notified when a command finishes, watch for
replies, or save incoming messages as JSONL.

```bash
npm run build && npx quicksend send -m "Build finished"
```

## Quick start

Run the interactive setup:

```bash
npx quicksend init
```

You'll need a Twilio account. Setup asks for your API credentials, lets you choose
a Twilio phone number and a default recipient, and sends a test message.

Then send yourself a text:

```bash
npx quicksend send -m "Hello from my terminal"
```

You can also use `yarn dlx quicksend` in place of `npx quicksend` in these examples.

## Sending messages

### Notify me when something finishes

Send a text after a command succeeds:

```bash
npm run build && npx quicksend send -m "Build finished"
```

Or notify yourself when it fails:

```bash
npm run build || npx quicksend send -m "Build failed"
```

### Send to a specific number

Override the default recipient with `-r`:

```bash
npx quicksend send -m "Deployment finished" -r "+1234567890"
```

### Watch for an error

Send one text when the first matching line appears in a log stream:

```bash
tail -f /var/log/syslog | grep -m 1 "error" | while IFS= read -r line; do
  npx quicksend send -m "Error found in logs"
done
```

Replace `/var/log/syslog` with the log file you want to watch.

## Receiving messages

### Wait for a reply

Wait for one incoming message, print its body, and exit:

```bash
npx quicksend receive
```

Start listening before sending a message if you're expecting a reply. Receive
checks for messages sent after listening starts.

To keep printing incoming messages until Ctrl+C or SIGTERM:

```bash
npx quicksend receive --follow
```

### Save incoming messages

Append messages to a JSONL file while also printing their bodies to stdout:

```bash
npx quicksend receive --follow --output messages.jsonl
```

Each line contains a JSON object with the Twilio message fields, including its SID,
body, sender, recipient, and timestamps. The file is created if needed, and existing
contents are preserved. Without `--follow`, only the first received message is
appended before the command exits.

| Receive option    | Behavior                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| `--follow`        | Keep receiving until Ctrl+C or SIGTERM.                                  |
| `--output <file>` | Append each received message as JSONL. Works with or without `--follow`. |
| `-q`, `--quiet`   | Suppress stdout. Messages still append to `--output` if supplied.        |

## Agent skill

Install the quicksend skill with Vercel's skills CLI:

```bash
npx skills add karimsa/quicksend --skill quicksend
```

The skill teaches your agent how to send and receive texts with quicksend. After
running `npx quicksend init`, try asking:

> Text me when the tests finish.

## License

Licensed under the MIT License.
