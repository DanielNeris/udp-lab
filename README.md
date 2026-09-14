# udp-lab

Building a reliable transport on raw UDP in Node.js, no dependencies. Turning
CS144 units 1 and 2 into code I can run.

## Usage

```bash
node server.js              # terminal 1, listens on 41234
node client.js hello world  # terminal 2
```

## Status

- [x] Session 1: UDP echo, characterizing the medium
- [ ] Session 2: custom binary header
- [ ] Session 3: stop-and-wait reliability
- [ ] Session 4: loss and duplication injection

## Session 1 findings

**Ephemeral ports.** The client never calls `bind()`, so the kernel picks a free
port (49152 to 65535 on macOS) at the first `send` and releases it on exit. Four
runs produced four different ports. The server port is fixed because it has to be
findable; the client port is disposable because it speaks first. That asymmetry is
what breaks in P2P, where both sides must be reachable.

**Three size ceilings, enforced in three different places:**

| Limit                           | Value   | Enforced by  | Reports an error? |
| ------------------------------- | ------- | ------------ | ----------------- |
| IP total length field           | 65507 B | the protocol | `EMSGSIZE`        |
| `net.inet.udp.maxdgram` (macOS) | 9216 B  | the OS       | `EMSGSIZE`        |
| Path MTU                        | ~1472 B | the network  | **silence**       |

2000 B and 7000 B both went through intact over loopback, which has an MTU of 16384.
That proves nothing about the real internet at 1500.

Forcing `lo0` down to MTU 1500 and resending the same 7000 B raised the RTT from
1.94 ms to 3.48 ms, while the payload still arrived intact. IP fragmented it into
five packets and reassembled them on the other side, and the application never knew.
That transparency is the problem: losing one fragment drops the entire datagram with
no notification, the loss probability multiplies by the fragment count, and many NATs
discard fragments outright since only the first one carries the ports. Budget adopted
here: 1200 B per datagram.

**Encapsulation.** An 8-byte payload goes out as 36 bytes: 20 B of IP header, 8 B of
UDP header, 8 B of data. The UDP header has four fields only: source port,
destination port, length, checksum. No sequence number, no ack, no window.

**Latency.** ~2 ms over loopback regardless of payload size (4 B and 7000 B measured
within noise of each other). This is measuring Node process startup, not the network:
fixed cost dominates entirely.

**Bug found.** The client armed a 2 s `setTimeout` and never cleared it on success,
so it fired anyway, reported a phantom loss, and closed an already-closed socket.
That is a retransmission timer with no cancellation on ack, exactly what lecture 2-9
describes. In UDP, timeout and success are not mutually exclusive by default; making
them so is application work.

## References

- CS144 (Stanford), units 1 and 2: [https://cs144.github.io/](https://cs144.github.io/)
- Node `dgram`: [https://nodejs.org/api/dgram.html](https://nodejs.org/api/dgram.html)
# udp-lab
