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

Send a message when a pattern is found in a log stream:

```bash
tail -f /var/log/syslog | quicksend grep -p "error" -m "Error found in logs"
```

## Receiving messages

This command will block until a message is received.

```bash
quicksend receive -q
```

## License

Licensed under the MIT License.
