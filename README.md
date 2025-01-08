# Don't Stand In Bad
Formerly just a macro editor, now all sorts of things crammed into a
long-suffering webapp.

# Dev, build, frameworks
Uses Vite, Typescript, React, MUI for web components.

Devcontainer *should* be sufficient to start with:
```
yarn
yarn dev
```
from a fresh install but you might need to do `corepack enable yarn` manually.

This was a learning project so some of the early typescript code is bad. Some of
the later typescript code is also bad, for other reasons.

# Backend
Currently using Firebase for authentication and storage. API keys aren't checked
it, use your own.

## Firestore emulator
Use the emulator during development to avoid exceeding quotas, e.g. if you screw
up a React component and end up hammering sub/unsub or something. Not that I'd
know.

```
firebase login
firebase init emulators
firebase emulators:start
```

# Coordinate systems
For the analysis and plans, we have to manage multiple different systems for
encoding position and facing.

I've tried to switch to using the game coordinates by default now, but it's
still WIP...

## Game
Units are yalms, x and y increasing from the top-left of the map. (Note this is
different from the game's 3D coordinate system, which is x,z with y as the
vertical).

I've not yet had to deal with absolute facings or locations in game data so I'm
chosing to assume they follow the same conventions as fflogs (arena centre is
100,100, facings are cw from east).
## FFLogs
x,y values are sent as integer values in units of 0.01 yalms, so 10000,10000
means 100.00, 100.00.

The centre of most boss arenas appears to be 100,100, it's not clear whether
this a game convention or postprocessing by fflogs.

Angles are sent as integer values in units of 0.01rad counted clockwise from
east (+ve X coordinate), but they come in the range [-3PI, -1PI] for no obvious
reason.

## Canvas
Units are pixels, the arena centre is 0,0. 22.5 pixels is one yalm.

Angles are in degrees measured clockwise from east.

## Human/display
Human-readable angles are degrees clockwise from north.
