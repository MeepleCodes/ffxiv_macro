# FFXIV Macro Editor/Previewer
Completely over-the-top solution to offline editing of FFXIV macros in the authentic font.

A from-scratch text editor implemented in HTML Canvas so we can use the sprite-based fonts
extracted from FFXIV (which it uses instead of vector/TTF-based fonts).

## TODOs
Vague list of features still to implement
[x] Kerning
[x] Character picker (slightly better one, but performance suffers)
[x] Line wrapping and/or scrolling
- Refactor control key bindings in TextEditor
- Switch to dynamically loading fonts and spritesheet (rather than the huge bundles we're currently making)
[x] Anything involving the mouse
- Dropping text (easy)
- Dragging text (why not! Seems easy enough)
- Input mode for entering unicode