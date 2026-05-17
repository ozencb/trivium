---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

TCP achieves reliable, ordered delivery by treating communication as a stateful contract: both sides track every byte sent and explicitly acknowledge receipt, retransmitting anything that goes missing.

---

**The core mechanism**

The internet is built on IP, which is best-effort — packets can be dropped, reordered, or duplicated. TCP sits on top and imposes a contract through three interlocking mechanisms:

**Sequence numbers and acknowledgments.** Every byte in a TCP stream has a sequence number. The sender tracks what it's sent; the receiver tracks what it's received and sends ACKs confirming the highest contiguous byte it has. If the sender doesn't get an ACK within a timeout window, it retransmits.

**The three-way handshake.** Before any data flows, both sides synchronize sequence numbers (SYN → SYN-ACK → ACK). This establishes shared state — both sides know where the byte stream starts and agree to the rules.

**Flow control via the receive window.** The receiver advertises how much buffer space it has. The sender can't flood the receiver — it can only have that many unacknowledged bytes "in flight" at once. This is why slow readers eventually slow down fast writers.

---

**Mental model**

Think of TCP like a postal service that issues registered mail. You write sequence numbers on each envelope. The recipient sends back signed confirmations. If a confirmation doesn't arrive, you resend that envelope. The recipient can buffer out-of-order envelopes but hands them to the application only in order. The protocol's state machine — `LISTEN`, `SYN_SENT`, `ESTABLISHED`, `TIME_WAIT`, etc. — tracks where each connection is in this lifecycle.

---

**Practical connections**

**Backend:** When you open a database connection and fire queries, you're depending on TCP to deliver query bytes and result bytes in order. A query result with bytes reordered would be corrupt data — TCP prevents that transparently. Connection pool sizing is partly about the cost of the handshake, not just the connection itself.

**SRE:** `TIME_WAIT` states in `ss -s` output, half-open connections, and retransmit counters in `netstat -s` are all TCP state machine artifacts. Seeing elevated retransmits points to packet loss; seeing `SYN_RECV` flooding points to a SYN flood attack or a saturated accept queue.

**Fullstack:** HTTP/1.1 and HTTP/2 run over TCP, so latency from connection establishment (the handshake) shows up in your waterfall charts. `Connection: keep-alive` reuses established TCP connections to avoid paying the handshake cost on every request. HTTP/3 moves to QUIC (UDP-based) partly to escape TCP's head-of-line blocking, where one lost packet stalls all streams.

The key invariant to hold onto: TCP gives you a reliable, ordered byte *stream*, not packets. Whatever you write arrives at the other end in order or the connection fails — there's no partial success.
