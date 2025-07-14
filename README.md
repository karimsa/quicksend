# quicksend

Utilities for sending and receiving text messages in your terminal.

## Installation

quicksend can be installed and updated as a normal node package.

```bash
npm install -g @karimsa/quicksend
```

After installation, run `quicksend init` to setup your account.

Note: `npx` does not play nice with this package, it doesn't like that the package is scoped.

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
