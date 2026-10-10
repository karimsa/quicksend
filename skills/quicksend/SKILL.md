---
name: quicksend
description: Use this to send and receive text messages.
---

# quicksend

## Usage

Use this to send and receive text messages.

## Description

- Send to the default recipient: `npx quicksend send -m 'Your message here'`.
- Choose a recipient: `npx quicksend send -m 'Your message here' -r '+1234567890'`.
- Receive: `npx quicksend receive` waits for one new incoming message, prints its body, then exits.
- When expecting a reply, start receive in a separate running process before sending. It only checks messages sent after listening starts.
- Run receive again to wait for the next message.
- Quote message text safely for the shell so its contents stay literal.
