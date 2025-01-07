# Don't Stand In Bad
Formerly just a macro editor, now all sorts of things crammed into a long-suffering webapp.

# Dev, build, frameworks
Uses Vite, Typescript, React, MUI for web components.

Devcontainer *should* be sufficient to start with:
```
yarn
yarn dev
```
from a fresh install but you might need to do `corepack enable yarn` manually.

This was a learning project so some of the early typescript code is bad. Some of the later typescript code is also bad, for other reasons.

# Backend
Currently using Firebase for authentication and storage. API keys aren't checked it, use your own.

## Firestore emulator
Use the emulator during development to avoid exceeding quotas, e.g. if you screw up a React component and end up hammering sub/unsub or something. Not that I'd know.

```
firebase login
firebase init emulators
firebase emulators:start
```