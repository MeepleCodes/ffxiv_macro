# Game format/engine notes
Notes on game file formats and data. Some of this information is in the ffxiv-client-data or the font loader repos.

# Reference sites
* [FFXIV Datamining](https://github.com/xivapi/ffxiv-datamining/blob/master/README.md). Stale but has some useful reference, and a dump of Ioncannon's research from FFXIV Explorer
  * [FFXIV Explorer Research](http://ffxivexplorer.fragmenterworks.com/research.php) original of above
* [FFIXVClientStructs](https://github.com/aers/FFXIVClientStructs) Mapping of C++ structs to C#, as used by Dalamud. Mostly concerned with the in-memory structures, they seem to mostly just invoke the game client's API to load/save from disk.
* [Lumina]() C# library for handling data files, *mostly* just the Excel tables but it has basic layer (.lgb) and texture support
* [Dalamud](https://github.com/goatcorp/Dalamud) API core for plugins, using FFXIVClientStructs and Lumina for data formats but sometimes a useful reference too
* [XIV.dev](https://xiv.dev/) Not updated recently but has a few useful references
* [Saint Coinach/Godbert](https://github.com/xivapi/SaintCoinach) Datminer/viewer, so more concerned with the on-disk structures.

# Copy/pasting from the game
Any regular text is copy/pasted as type text/plain, as you'd expect.

Copying text containing a link/autocomplete from the game client puts the plain text representation on the system clipboard, but clearly stores the real data including payloads somewhere in the client's memory.

Externally setting the clipboard to contain \x02 somewhere in the text and pasting into the client causes it to insert the contents of its internal "text with payloads" buffer regardless of what's in the system clipboard, which will notable produce nothing at all if haven't previously copied in-game (TODO: test whether it's actually always using the internal buffer).

I'm not sure how it tells when you've copied a payload-containing string in the client, then copied another string from outside the game - I can see no obvious difference in what's in the buffers, even at the win32 level. Maybe it's listening to system clipboard events?

Basically I can't see a way of pasting rich text (links etc) into the client from an external app short of poking at the game client.