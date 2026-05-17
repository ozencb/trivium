---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## Media Session API

The browser has long been able to play audio and video, but it was historically a black box to the OS—your custom music player had no way to tell the lock screen what's playing or respond to the user pressing "next track" on their headphones. The Media Session API closes that gap: it lets you push metadata to the platform and register handlers for playback actions the OS or browser chrome exposes.

**The core mechanism**

The API hangs off `navigator.mediaSession`. You set `metadata` (title, artist, album, artwork) and register action handlers for things like `play`, `pause`, `nexttrack`, `previoustrack`, `seekto`, and `seekbackward`/`seekforward`. The platform calls your handlers when the user interacts with OS-level controls—lock screen buttons on iOS/Android, the media notification on desktop Chrome, hardware media keys on keyboards.

```js
navigator.mediaSession.metadata = new MediaMetadata({
  title: 'Episode 42',
  artist: 'Some Podcast',
  artwork: [{ src: '/cover.jpg', sizes: '512x512', type: 'image/jpeg' }]
});

navigator.mediaSession.setActionHandler('nexttrack', () => {
  playNext();
});

navigator.mediaSession.setActionHandler('seekto', (details) => {
  audio.currentTime = details.seekTime;
});
```

You also update `navigator.mediaSession.playbackState` (`'playing'` / `'paused'` / `'none'`) and call `setPositionState()` to keep the scrubber in sync with actual playback position.

**Where this matters in practice**

For a frontend engineer building a podcast player, music app, or video streaming UI: without this, when a user locks their phone mid-episode, the lock screen shows no controls. With it, they get artwork, a progress bar, and skip buttons—indistinguishable from a native app.

For fullstack work, the session metadata doesn't go to the server—it's purely client-side browser-to-OS plumbing. The practical consideration is that your client state management needs to stay in sync: if the user skips a track via the lock screen, your React/Vue state has to update, not just the `<audio>` element.

**Common pitfalls**

- Handlers aren't registered automatically—you have to call `setActionHandler` or the OS control simply doesn't appear. Many devs forget `seekto` and wonder why the lock screen scrubber is dead.
- `setPositionState` needs to be called on every meaningful position change (seek, playback rate change), not just once.
- Browsers only activate the session when media actually plays. Setting metadata before playback starts does nothing until the audio plays.
- Safari on iOS has partial support—test there explicitly.

**When to reach for it**

Any web app where users are likely to leave the tab: podcasts, music, long-form video, audiobooks. If your users are playing media and doing other things on their device simultaneously, this API is the difference between feeling native and feeling broken.
