# quicksend

Utilities for sending and receiving text messages in your terminal.

## Installation

quicksend can be installed globally or used via `npx` / `yarn dlx`.

```bash
npx quicksend init
```

OR

```bash
npm install -g quicksend
```

## Sending messages

Send a text message:

```bash
quicksend send -m "Hello, world!"
```

Send a message to a specific recipient:

```bash
quicksend send -m "Hello, world!" -r "+1234567890"
```

Send one message when a pattern is first found in a log stream:

```bash
tail -f /var/log/syslog | grep -m 1 "error" | while IFS= read -r line; do
  quicksend send -m "Error found in logs"
done
```

## Receiving messages

This command will block until a message is received.

```bash
quicksend receive -q
```

To print incoming messages continuously until Ctrl+C or SIGTERM:

```bash
quicksend receive --follow
```

Add `-q` to keep listening without printing messages.

Append each received message as a JSON object on its own line:

```bash
quicksend receive --follow --output messages.jsonl
```

The file is created if needed. Existing contents are preserved. Each record contains
the Twilio message fields, including its SID, body, sender, recipient, and timestamps.
Without `--follow`, the command appends the first received message and exits.
Message bodies still print to stdout unless `-q` is supplied, which only silences stdout.

## License

Licensed under the MIT License.
