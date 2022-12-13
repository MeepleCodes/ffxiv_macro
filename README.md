# FFXIV Macro Editor/Previewer
Completely over-the-top solution to offline editing of FFXIV macros in the authentic font.

A from-scratch text editor implemented in HTML Canvas so we can use the sprite-based fonts
extracted from FFXIV (which it uses instead of vector/TTF-based fonts).

## TODOs
Vague list of features still to implement
[x] Kerning
[x] Character picker (slightly better one, but performance suffers)
[x] Line wrapping and/or scrolling
[~] Refactor control key bindings in TextEditor
- Column-mode selection
[x] Switch to dynamically loading fonts and spritesheet (rather than the huge bundles we're currently making)
  [That was far more complicated than it had any right to be]
[x] Anything involving the mouse
- Double-click to selet a word, triple-click to select line, quad for whole document
[x] Dropping text (easy)
[x] Dragging text (why not! Seems easy enough) [you fool. You utter rube.]
- Input mode for entering unicode
- Form association (https://html.spec.whatwg.org/multipage/custom-elements.html#concept-custom-element-definition-form-associated)
[x] Refactor to make all functions that use TextEditor.font etc take a custom this: type declaration
  [ Messy but worked ]
- Status bar with current cursor and pixel position
- Command to attempt to increase or decrease the length of a selection by replacing spaces/wide spaces
- Replace character picker with a canvas-based solution?
- Tooltips on character picker to show glyph dimensions
- Saving and loading macros with firebase storeage or similar