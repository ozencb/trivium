---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## TCP Basics

TCP (Transmission Control Protocol) is a connection-oriented protocol that guarantees ordered, reliable delivery of a byte stream between two endpoints. It exists because IP is inherently lossy and unordered — TCP adds the machinery to make it behave otherwise.

### The Core Mechanism

TCP is fundamentally about two things: **establishing shared state** between endpoints, and **maintaining that state** across the lifetime of a connection.

Before any data flows, both sides run a three-way handshake (SYN → SYN-ACK → ACK). This isn't ceremony — it bootstraps the **sequence numbers** that make everything else work. Every byte sent gets a sequence number; every byte received triggers an acknowledgment (ACK). The receiver says "I got up to byte N, send me N+1." If the sender doesn't hear an ACK within a timeout window, it retransmits.

This ACK loop is the backbone of TCP's reliability. It means:
- Packets can arrive out of order — TCP resequences them.
- Packets can be dropped — TCP retransmits them.
- Duplicates are discarded — sequence numbers catch them.

The sender doesn't wait for each ACK before sending the next packet. It maintains a **window** of in-flight bytes it's allowed to have unacknowledged. The receiver advertises how much buffer space it has (the **receive window**), and the sender stays within that limit. This is flow control — it prevents a fast sender from overwhelming a slow receiver.

Connection teardown is a four-way exchange (FIN → ACK, FIN → ACK) because each direction closes independently. This is why `TIME_WAIT` exists: the closing side has to wait to ensure its final ACK was received before discarding connection state.

### Mental Model

Think of TCP like sending a long document via postal mail, split across many envelopes, each numbered. You send a batch, and for each one the recipient sends back "got #7, got #8..." If you don't hear back about #9 after a while, you resend it. You only send so many at once — you don't want to flood their mailbox before they've processed what's there.

### Practical Implications

**Backend:** When you open a database connection, that three-way handshake costs real latency — typically one round trip. Connection pooling exists largely to amortize this cost. `SO_REUSEADDR` and `TCP_NODELAY` are knobs you'll hit when tuning servers.

**SRE:** `TIME_WAIT` exhaustion is a real failure mode under heavy churn. If a service opens thousands of short-lived connections per second, you can run out of ephemeral ports. `net.ipv4.tcp_tw_reuse` and connection pooling are the levers. Also: RSTs vs FINs in packet captures tell you *how* a connection died, which is diagnostic gold.

**Fullstack:** HTTP/1.1 keep-alive and HTTP/2 multiplexing are both attempts to avoid paying the TCP handshake cost per request. Understanding that HTTP/2 runs multiple streams over a single TCP connection explains why head-of-line blocking moved from the HTTP layer down to the TCP layer.
