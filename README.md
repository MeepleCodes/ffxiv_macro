# FFXIV Macro Editor/Previewer
Completely over-the-top solution to offline editing of FFXIV macros in the authentic font.

A from-scratch text editor implemented in HTML Canvas so we can use the sprite-based fonts
extracted from FFXIV (which it uses instead of vector/TTF-based fonts).
## Bugs
- There's *some* order of delete/insert (maybe clipboard) that doesn't create two undo states, just one
- Moving the cursor doesn't finalise the previous undo state so insert > move > insert is a single state
- Scrolling from keyboard navigation isn't quite working (down arrow, at least)

## Bugs
[x] CPU usage wtf
[x] Drop insertion point drawn in the wrong place at the end of a line
- Cursor not restored correctly when undo/redoing
- Insert/move cursor/insert is merging undo states; should be separate
[x] Re-implement autoscroll in refactored editor

## TODOs
Vague list of features still to implement
[x] Kerning
[x] Character picker (slightly better one, but performance suffers)
[x] Line wrapping and/or scrolling
[~] Refactor control key bindings in TextEditor
[x] Last character in selection should select max of g.w/g.advanceWidth (vertical line have a huge +ve right margin)
[x] Insert by drag/drop or glyph picker should be its own Undo state
- Always show cursor (maybe don't blink if not focused?)
[x] Styling via CSS (including ::selection)
[x] Drag and drop from glyph picker into editor window
- Zoom button as well as font size
- Add the Lodestone's icon font to the page so we can render it in title fields, input boxes etc
  (not usable for everything because it's *only* the private codepage and they don't put out the rest of Axis, so all other charcaters are wrong)
[x] Text colour
[x] Optimise rendering
  [x] Only render what's changed
  - Do a full redraw on requestAnimationFrame but only redraw if needed (would get around not being able to spot CSS changes)
- Column-mode selection, multiple selections
  - Selecting zero characters on multiple rows produces multiple cursors
  - Copy/paste gets interesting. Desired/imitated behaviour (notepad++, seems to cheat and use internal flag to differentiate):
    - Paste with no selection: insert first row of clipboard data at current caret, each subsequent row in the same column further down
    - Paste with active selection: delete all active selections, then paste as if no selection above
  - VSCode does it differently:
    - Paste with no selection: insert as if it was a regular text w/ newlines
    - Paste with selection *that has the same number of rows*: delete and replace with 
[x] Refactor TextEditor/TextModel more thoroughly into MVC split
  [x] Model knows about glyphs and pixels
  [x] View is just the canvas/render stuff
  [x] Control is the event handlers
[x] Refactor the cursor/coordinate/x/y complexity into something cleaner
[x] Use visual position rather than column during vertical cursor movement (?)
[x] Switch to dynamically loading fonts and spritesheet (rather than the huge bundles we're currently making)
  [That was far more complicated than it had any right to be]
[x] Anything involving the mouse
- Double-click to selet a word, triple-click to select line, quad for whole document
[x] Dropping text (easy)
[x] Dragging text (why not! Seems easy enough) [you fool. You utter rube.]
- Input mode for entering unicode
- More shortcuts for commonly used glyphs (vertical/horizontal lines, letters/numbers in boxes)
- Form association (https://html.spec.whatwg.org/multipage/custom-elements.html#concept-custom-element-definition-form-associated)
[x] Refactor to make all functions that use TextEditor.font etc take a custom this: type declaration
  [ Messy but worked ]
[x] Status bar with current cursor and pixel position
  - No. of lines selected
[x] View whitespace (U+00B7 for short space, something for long space)
- Kerning class, link to unicode definition/names for glyph picker tooltip
- Common glyphs as well as full browser (types of space, the lines, ???)
- Ctrl-B to cycle between thin and thick lines within selection
- Glyph browser page?
- Command to attempt to increase or decrease the length of a selection by replacing spaces/wide spaces
[x] Replace character picker with a canvas-based solution
  - Drag/drop still needed on new glyph picker
[x] Tooltips on character picker to show glyph dimensions
[x] Split App.tsx up into components
  [x] Make a proper React component wrapper around text-editor
    - onChange event from text-editor to make that work better
  - Would making the statusbar a memo()d component improve performance?
[x] Start using MUI
  [x] Keep is a good template to take inspiration from
- Overlays for common chat window sizes
- Dark theme
- Line count in status bar (and warn if >15)
- Move web component to asset-loaded CSS
[~] Saving and loading macros with firebase storeage or similar
  - 'New' button
  - Delete button
  - More fields on documents:
    - Created/last modified
    - Owner
    - Tags
  - Authentication and user management
    - Privacy policy and ToS :<
    - Upgrading anonymous users (merge by assigning all anonymous user's macros to existing auth)
  - Loading/browsing could eventually use something like https://github.com/bvaughn/react-window for lazy loading
- Icons from https://xivapi.com/MacroIcon
- Tags for macros. Use XIVAPI for lists of applicable tags?
  - Class/job: https://xivapi.com/ClassJob?pretty=1
  - Trials and Raids: https://xivapi.com/search?filters=ContentFinderCondition.ContentType.ID%3E=4,ContentFinderCondition.ContentType.ID%3C=5&pretty=1
   (note this only has the latest Unreal on the list so that's a bit of a pain)
- Icon browser for /micon selection (XIVAPI again)