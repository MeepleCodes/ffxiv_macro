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

# Abilities and their areas of effect

The column from Actions for radius around target is `effectRange` in yalms.

## Cast types
Cast type determines the shape of the AoE from an action.

From [BossMod](https://github.com/awgil/ffxiv_bossmod/blob/master/BossMod/BossModule/AIHintsBuilder.cs)

    2 => new AOEShapeCircle(data.EffectRange), // used for some point-blank aoes and enemy location-targeted - does not add caster hitbox
    3 => new AOEShapeCone(data.EffectRange + actor.HitboxRadius, DetermineConeAngle(data) * 0.5f),
    4 => new AOEShapeRect(data.EffectRange + actor.HitboxRadius, data.XAxisModifier * 0.5f),
    5 => new AOEShapeCircle(data.EffectRange + actor.HitboxRadius),
    //6 => ???
    //7 => new AOEShapeCircle(data.EffectRange), - used for player ground-targeted circles a-la asylum
    //8 => charge rect
    10 => new AOEShapeDonut(DetermineDonutInner(data), data.EffectRange),
    11 => new AOEShapeCross(data.EffectRange, data.XAxisModifier * 0.5f),
    12 => new AOEShapeRect(data.EffectRange, data.XAxisModifier * 0.5f),
    13 => new AOEShapeCone(data.EffectRange, DetermineConeAngle(data) * 0.5f),

From [event-trigger](https://github.com/xpdota/event-trigger/blob/master/xivsupport/src/main/java/gg/xp/xivsupport/gui/map/MapPanel.java#L892)

    From Valarnin:
    2 - Circle AoE, range directly based on `EffectRange` column
    3 - Cone, range is `EffectRange` + actor's hitbox radius, angle depends on Omen
    4 - Rectangle, range is `EffectRange` + actor's hitbox radius, offset is half of `XAxisModifier` column?
    5 - Circle AoE, range is `EffectRange` + actor's hitbox radius
    6 - I think these are circle AoEs with no actual ground-target AoE shown even as they're resolving, e.g. `Twister`. Should use one of the two formulas (including hitbox raidus or excluding), but not sure.
    8 - "wild charge" rectangle, not sure exactly how width is determined, probably also half of `XAxisModifier`?
    10 - Donut AoE, not sure how inner/outer range is calculated
    11 - cross-shaped AoEs? not 100% sure on this one
    12 - Rectangle, range is `EffectRange`, offset is half of `XAxisModifier` column
    13 - Cone, range is `EffectRange`, angle depends on Omen
        */
    /*
    My further notes:
    #10 - effect range is the outer radius

    #11 - yes, it's cross

    #12 is a rectangle, but sometimes it is centered on the caster, extending <effectRange> forward and back
        Perhaps cast angle/position will help

    #13 seems to be not only cones, but also things like Omega's "Swivel Cannon" in TOP P5,
    which is a half-room cleave but with the angle offset a bit.

### Cones
BossMod tries to use omen data to determine cone angle, often not present.

Examples:
* [Honeyed Breeze](https://xivapi.com/Action/37224) is AAC M2 normal tankbuster - a narrow cone, <45?. effectRange 40, animation 7929, key mon_sp/gimmick/n4gb_boss_gimmick03
* [Stinging Slash](https://xivapi.com/Action/37277) is the tankbuster on savage - approx 90 degrees. effectRange 50, animation 7592, key mon_sp/gimmick/n4g6_boss_gimmick05
* [Laceration](https://xivapi.com/Action/37299) - the cone part of Xstage Combo in savage. 45 degrees. effectRange 30, animation 1378, key mon_sp/gimmick/monster_hanyou_hitclip_nomi_saisoku ("monster generic hitclip only fastest")
* [Black Cat Crossing](https://xivapi.com/Action/37649) - AAC M1 normal's Crossing, 45 degrees. effectRange 60, animation 11111, key mon_sp/gimmick/x6r1_boss_gimmick01

The only material differences in the first three are effectRange and Animation{End}, so I guess the in-cone hit detection is purely serverside and we need to look elsewhere for cone area. The Animation{end} IDs seem to be shared with completely unrelated boss fights (eg Stinging Slash uses the same one as Ferostorm from Eden savage, Laceration uses the same one as a *ton* of actions) so they are probably fairly generic. What could we deduce from that, then?

Black-Cat Crossing has a cast time and an Omen, so we could determine the cone range from that.

### Donuts
BossMod uses omen data here too, FFXIVActionEffectRange uses predefined maps, so again I guess not available client-side.

Examples:
* [Laceration](https://xivapi.com/Action/37300) - the donut in Xstage Combo in savage. Inner radius is ~the same as the PBAE version (37297)'s outer radius, 7 yalms.

Laceration's Animation{end} is 1378, the same mon_sp/gimmick/monster_hanyou_hitclip_nomi_saisoku as above, so this isn't helpful unless the animations can be separated?

## Omen
The floor telegraph for (easier raid) actions that give a prediction on the hit.

* Omen ID 2 (path "general02f") is a straight-line telegraph (PhysRanged LB, Thunderstrike from bugs, Blinding Love from bees)
* Omen 583 (path "er_gl_fan045_0p1") is a 45 degree cone

[event-trigger](https://github.com/xpdota/event-trigger/blob/master/xivdata/src/main/java/gg/xp/xivdata/data/ActionLibraryImpl.java) has some extracted cone angles from omen IDs, I'm guessing you need to find the data at the referenced path and read that somehow.
