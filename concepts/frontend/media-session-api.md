---
model: claude-sonnet-4-6
prompt_version: 459a3b0ff906
---

## Media Session API

The Media Session API lets your web app integrate with the OS-level media controls — the ones that appear in lock screens, notification trays, and via hardware media keys — so users can control playback without having the tab focused.

### The core mechanism

Browsers have a concept of a "media session" that gets activated when your page plays audio or video. By default, the browser exposes minimal info ("a tab is playing audio"). The API gives you two levers:

1. **Metadata** — tell the OS what's actually playing (title, artist, album, artwork)
2. **Action handlers** — intercept OS-level control events (play, pause, next track, seek, etc.)

```js
navigator.mediaSession.metadata = new MediaMetadata({
  title: 'Across the Universe',
  artist: 'The Beatles',
  album: 'Let It Be',
  artwork: [{ src: '/album-art.jpg', sizes: '512x512', type: 'image/jpeg' }]
});

navigator.mediaSession.setActionHandler('nexttrack', () => {
  playNext();
});

navigator.mediaSession.setActionHandler('seekto', ({ seekTime }) => {
  audioEl.currentTime = seekTime;
});
```

Without this, pressing the hardware "next track" key on a keyboard while your music app is playing does nothing. With it, that key fires your handler.

### Mental model

Think of it as a contract between your app and the OS media layer. The OS says "I'll show your media in the notification tray and route hardware key events to you — but you have to tell me what's playing and handle the events." The API is that handshake.

### Practical scenarios

**Frontend (music/podcast player):** A Spotify-like PWA needs this to feel native. Users expect to skip tracks from their AirPods or lock screen. Without `setActionHandler('nexttrack', ...)`, those controls are dead. You also want to call `navigator.mediaSession.setPositionState()` so the progress bar in the OS widget reflects actual playback position.

**Fullstack (video platform):** Your server streams video, your client plays it. The Media Session API lets you pull episode metadata from your API and surface it in the OS player widget. When a user pauses from the lock screen, your handler fires, you update your analytics/watch-position endpoint — the OS gesture triggers your business logic cleanly.

**Background tabs:** This is where it really earns its keep. Users routinely background media tabs. Without Media Session, those users have no way to control playback except switching back to the tab. With it, your app stays controllable from wherever the user is.

### Worth knowing

Browser support is broad (Chrome, Firefox, Safari), but Safari has some quirks with `seekto` and `seekforward`/`seekbackward` handling. The API is synchronous-feeling but the actual event delivery from hardware keys can have slight OS-level delay — don't design UX that's latency-sensitive to it.
