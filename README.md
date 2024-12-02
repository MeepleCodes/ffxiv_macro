# FFXIV Macro Viewer

## Copy/pasting from the game
Any regular text is copy/pasted as type text/plain, as you'd expect.

Copying text containing a link/autocomplete from the game client puts the plain text representation on the system clipboard, but clearly stores the real data including payloads somewhere in the client's memory.

Externally setting the clipboard to contain \x02 somewhere in the text and pasting into the client causes it to insert the contents of its internal "text with payloads" buffer regardless of what's in the system clipboard, which will notable produce nothing at all if haven't previously copied in-game (TODO: test whether it's actually always using the internal buffer).

I'm not sure how it tells when you've copied a payload-containing string in the client, then copied another string from outside the game - I can see no obvious difference in what's in the buffers, even at the win32 level. Maybe it's listening to system clipboard events?

# Replay/analysis tool
Bolted on here because I had the project open, could probably be shifted off to its own thing these days but w/e.

## TODOs
* fflogs/locator needs to take instance ID into account!
* Finish refactoring analysis/events
  * Source/target as ReplayActorSnapshot
  * Location in ReplayActorSnapshot is either precise or estimated (using locator)
  * Add lerpFrom/To to estimated location when lerping so we can show ghost images and a line?
  * Move all this into a loader call so it can be abstracted away from FFLogs a bit more?
* components/analysis/Replay work
  * Table needs to not wrap when shrunk
  * Add source/target x/y/facing columns
  * Show hovered row event too
  * Checkboxes on rows
    * separate ones for 'actor' and 'cast' or just the one?
  * Reintroduce the timeline and replay actor locations
  * Make canvas fullscreen
  * Hover for locations
  * Highlight actions with unknown cone/inner radius
* 

