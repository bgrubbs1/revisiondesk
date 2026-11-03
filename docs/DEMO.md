# Replay walkthrough

The package's `demo/revisiondesk-replay.webm` is an actual recording of the local application using original synthetic fixtures. It has no voice-over. The FIXTURE REPLAY banner stays visible during replay. The live-mode segment demonstrates unavailable configuration, not a successful provider call. No customer data appears.

The recording demonstrates source highlights, four-field human acknowledgment, a reviewer note, a downloaded audit, missing expiry, conflicting terms, Guard hold, invalid Unicode evidence, low confidence, routine reissue, Decide disagreement, and the narrow layout. Use the [three-minute narration plan](ENTRY.md) when producing the final judged presentation. Record an authorized live segment before claiming live integration.

Run `npm start` to explore the actual application at http://127.0.0.1:4177. The recording is preparation material; it has not been publicly uploaded.

The package also contains `history/revisiondesk.bundle`, a Git bundle with the real local checkpoint history. To inspect it separately:

```sh
git clone history/revisiondesk.bundle revisiondesk-history
git -C revisiondesk-history log --oneline
```
