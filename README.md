# FFXIV Macro Editor/Previewer
Completely over-the-top solution to offline editing of FFXIV macros in the authentic font.

A from-scratch text editor implemented in HTML Canvas so we can use the sprite-based fonts
extracted from FFXIV (which it uses instead of vector/TTF-based fonts).
## Bugs
- There's *some* order of delete/insert (maybe clipboard) that doesn't create two undo states, just one
- Moving the cursor doesn't finalise the previous undo state so insert > move > insert is a single state
- Scrolling from keyboard navigation isn't quite working (down arrow, at least)
- Cursor not restored correctly when undo/redoing
- Mouse events are firing on the scrollbars
- Save New isn't working properly (might not be setting deleted=false, but also console errors)
- If the screen is to wide for both editor and glyph picker to be in one row, it doesn't scroll properly

## Fixed bugs
[x] CPU usage wtf
[x] Drop insertion point drawn in the wrong place at the end of a line
[x] Show/hide whitespace not toggling
[x] Re-implement autoscroll in refactored editor

## TODOs
Vague list of features still to implement
[x] Kerning
[x] Character picker (slightly better one, but performance suffers)
[x] Line wrapping and/or scrolling
[~] Refactor control key bindings in TextEditor
[x] Last character in selection should select max of g.w/g.advanceWidth (vertical line have a huge +ve right margin)
[x] Insert by drag/drop or glyph picker should be its own Undo state
[x] Always show cursor (maybe don't blink if not focused?)
[x] Styling via CSS (including ::selection)
[x] Drag and drop from glyph picker into editor window
- Zoom button as well as font size
- Add the Lodestone's icon font to the page so we can render it in title fields, input boxes etc
  (not usable for everything because it's *only* the private codepage and they don't put out the rest of Axis, so all other charcaters are wrong)
[x] Text colour
[x] Optimise rendering
  [x] Only render what's changed
  - Do a full redraw on requestAnimationFrame but only redraw if needed (would get around not being able to spot CSS changes)
[x] Column-mode selection, multiple selections
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
[x] Common glyphs as well as full browser (types of space, the lines, ???)
- Glyph picker enhancements
  - Don't auto-sort glyphs in sections so we can have all the spaces at the start of the 'useful' section
    - OR remove them from 'useful' and put them in the "insert some space" button list
  - Kerning class/table
  - unicode names for glyph picker tooltip
  - Double-click to insert should un-pin the tooltip
  - Close button when the tooltip is pinned
  - Double-clicking repeatedly doesn't insert as often as you'd expect
- Ctrl-B to cycle between thin and thick lines within selection
- Separate glyph browser page?
- Help/tips page(s)?
- Command to attempt to increase or decrease the length of a selection by replacing spaces/wide spaces
- List of possible pixel-width spaces and buttons to insert them (3, 6, 7, 9, 10, 12, 13, 14[, 15, 16 etc all trivial from here])
[x] Replace character picker with a canvas-based solution
  [x] Drag/drop still needed on new glyph picker
[x] Tooltips on character picker to show glyph dimensions
[x] Split App.tsx up into components
  [x] Make a proper React component wrapper around text-editor
    [x] onChange event from text-editor to make that work better
  - Would making the statusbar a memo()d component improve performance?
[x] Start using MUI
  [x] Keep is a good template to take inspiration from
- Overlays for common chat window sizes
  - Mine is ~466x189px, most standard macros seem to come up maybe a bit shorter
[x] Dark theme
- Further UI improvements
  - Remove app bar, replace with small title box
  - Left panel for logins, hidden if logged out
  - Move glyphs etc. to right drawer?

- Amusing default macro contents
- Line count in status bar (and warn if >15)
- Move web component to asset-loaded CSS
[~] Saving and loading macros with firebase storeage or similar
  - 'New' button
  - Delete button
  - Mark dirty
    - Warn on load/navigate away
    - Disable save unless dirty
  - Auto-saving drafts (including for anonymous users)
  - More fields on documents:
    [x] Created/last modified
    [x] Owner
    - Tags
  - Disabling stuff when load/save is in progress
  - Shippable alpha auth/user state:
    - No signups
    - Signin button reasonably well hidden
    - Save buttons removed
    - Remove anonymous auth (? browser-local storage of current editor *probably* achieves the same thing)
      - BUT if we want last-editor-state/drafts to persist to account then maybe not...
  - Beta:
    - Signup via e-mail/google/???
    - Can only view own macros
  [~] Authentication and user management
    - Privacy policy and ToS :<
    - Upgrading anonymous users (merge by assigning all anonymous user's macros to existing auth)
    - Move away from firebase-ui as it's a bit rubbish, but doing it by hand will really suck
  - Loading/browsing could eventually use something like https://github.com/bvaughn/react-window for lazy loading
- Icons from https://xivapi.com/MacroIcon
- Tags for macros. Use XIVAPI for lists of applicable tags?
  - Class/job: https://xivapi.com/ClassJob?pretty=1
  - Trials and Raids: https://xivapi.com/search?filters=ContentFinderCondition.ContentType.ID%3E=4,ContentFinderCondition.ContentType.ID%3C=5&pretty=1
   (note this only has the latest Unreal on the list so that's a bit of a pain)
[~] Icon browser for /micon selection (XIVAPI again)
[x] Better favicons (https://www.emergeinteractive.com/insights/detail/the-essentials-of-favicons/) - 32, 128, 180, 192px