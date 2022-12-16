# FFXIV Macro Editor/Previewer
Completely over-the-top solution to offline editing of FFXIV macros in the authentic font.

A from-scratch text editor implemented in HTML Canvas so we can use the sprite-based fonts
extracted from FFXIV (which it uses instead of vector/TTF-based fonts).

## Bugs
- Drop insertion point drawn in the wrong place at the end of a line
- Cursor not restored correctly when undo/redoing

## TODOs
Vague list of features still to implement
[x] Kerning
[x] Character picker (slightly better one, but performance suffers)
[x] Line wrapping and/or scrolling
[~] Refactor control key bindings in TextEditor
- Last character in selection should select max of g.w/g.advanceWidth (vertical line's have a huge +ve right margin)
- Insert by drag/drop or glyph picker should be its own Undo state
- Show-whitespace mode
- Always show cursor (maybe don't blink if not focused?)
[x] Styling via CSS (including ::selection)
[x] Drag and drop from glyph picker into editor window
- Refactor the cursor/coordinate/x/y complexity into something cleaner
- Use visual position rather than column during vertical cursor movement (?)
- Add the Lodestone's icon font to the page so we can render it in title fields, input boxes etc
  (not usable for everything because it's *only* the private codepage and they don't put out the rest of Axis, so all other charcaters are wrong)
[x] Text colour
- Optimise rendering
  - Only render what's changed
  - Do a full redraw on requestAnimationFrame but only redraw if needed (would get around not being able to spot CSS changes)
- Column-mode selection
[x] Switch to dynamically loading fonts and spritesheet (rather than the huge bundles we're currently making)
  [That was far more complicated than it had any right to be]
[x] Anything involving the mouse
- Double-click to selet a word, triple-click to select line, quad for whole document
[x] Dropping text (easy)
[x] Dragging text (why not! Seems easy enough) [you fool. You utter rube.]
- Input mode for entering arbitary unicode?
- Form association (https://html.spec.whatwg.org/multipage/custom-elements.html#concept-custom-element-definition-form-associated)
[x] Refactor to make all functions that use TextEditor.font etc take a custom this: type declaration
  [ Messy but worked ]
[x] Status bar with current cursor and pixel position
- Command to attempt to increase or decrease the length of a selection by replacing spaces/wide spaces
- Replace character picker with a canvas-based solution?
[x] Tooltips on character picker to show glyph dimensions
- Split App.tsx up into components
  - Make a proper React component wrapper around text-editor
    - onChange event from text-editor to make that work better
  - Would making the statusbar a memo()d component improve performance?
- Start using MUI
[~] Saving and loading macros with firebase storeage or similar
  - Authentication and user management
  - Loading/browsing could eventually use something like https://github.com/bvaughn/react-window for lazy loading