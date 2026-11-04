# Replay walkthrough

The package's `demo/revisiondesk-replay.webm` is an actual recording of the local application using original synthetic fixtures. It has no voice-over. The FIXTURE REPLAY banner stays visible during replay. The live-mode segment demonstrates unavailable configuration, not a successful provider call. No customer data appears.

The recording demonstrates source highlights, four-field human acknowledgment, a reviewer note, a downloaded audit, missing expiry, conflicting terms, Guard hold, invalid Unicode evidence, low confidence, routine reissue, Decide disagreement, and the narrow layout. Use the [three-minute narration plan](ENTRY.md) when producing the final judged presentation. Record an authorized live segment before claiming live integration.

**[Open the public replay demo](https://bgrubbs1.github.io/revisiondesk/).** Its deployment and browser assets were verified on November 4, 2026, including the missing-expiry evidence hold and disabled completion. The [public repository](https://github.com/bgrubbs1/revisiondesk) contains the real development history. The [replay video](https://github.com/bgrubbs1/revisiondesk/blob/main/demo/revisiondesk-replay.webm) is also published and its public file was verified on November 4.

The public site runs browser fixtures without credentials and disables live mode. A static host cannot provide the local Node live-analysis route. The replay banner and authored-data explanation remain visible. Run `npm start` to explore the local app at http://127.0.0.1:4177. No credentialed Clocked calls or contest submission have occurred.

For the [challenge entry](https://clocked.rezolve.ai/challenge), provide a verified working demo link or a short video of the app in use, alongside the public repository. Keep both reviewable through November 18, 2026. Publishing the recording or the site does not save the official contest form.

The package also contains `history/revisiondesk.bundle`, a Git bundle with the real local checkpoint history. To inspect it separately:

```sh
git clone history/revisiondesk.bundle revisiondesk-history
git -C revisiondesk-history log --oneline
```
