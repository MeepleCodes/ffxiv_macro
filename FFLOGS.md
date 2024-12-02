# Analysis
Notes on various analysis tools and data sources.

# Getting data
Main source is FFLog's V2 API, augmented with data from XIVApi and Garlond.

## Background images
https://cf.raidplan.io/raid/ff.aac1/map/01.r1-main.jpg

## FFLogs
FFLogs's own UI uses a "cast-events" data source to get a list of events with "childEvent" arrays (the damage done by a cast when it lands); this doesn't seem to be available through the GraphQL API which sucks.

You also don't get worldMakers in the ReportData > report > fights array, and I don't see any place to get those via the API.

# Coordinate system

## Locations
FFLogs 2D coordinates are x=horizontal, y=vertical, starting from the top-left
corner and drawing down and right.

The raw values are in units of 0.01 yalm; the coordinates they show on the
replay are in yalms. The arena centre tends to be at 100,100; no idea if that's
an FFLogs adjustment or what the actual game does.

## Facings
FFLog values are in units of 0.01rad CW starting from east, they all seem to be
between -PI and -3PI for... reasons but you can modulo that out.
* -786 is north
* -315 is west
* -629 is east (= -2PI = 0)
* -472 is south (= -1.5PI = 0.5PI)


# Zone backgrounds
raidplan.io seems to have made custom-drawn zone backgrounds, rendering our own looks like it would be a massive pita so we'll borrow theirs for now

Their images are 2000x1126px regardless

Black Cat's coordinate space is 200x200? Centrepoint is at 100,100, big squares are 10x10, so the fightable area is 80,80 to 120,120
- squares are 225px wide in raidplan, so 22.5px/yalm

Honey B. Lovely spawns at 100,90. Biggest bounding box is just under 75,75 to 125,125, so the moveable area is probably a 20-unit radius circle.
- raidplan image is 900px across the circle, so 22.5px/yalm again?

# Identifying zones
There doesn't seem to be any correlation between FFLogs zone or encounter IDs and FFXIV's (e.g. for field marker presets)

Field marker presets reference a zone by ContentFinderCondition.ID (in XIVAPI.com model), presumably because they want to have separate waymarks for the same zone at different difficulties. FFLogs encounter ID is probably internal (given it's only up in the 90s for 7.0 savage raids) and I'm not sure what their gameZone maps to.

Some notes
## AACM2S
FFLogs report fight object
```
    ...
    "name": "Honey B. Lovely",
    "gameZone": {
        "id": 1228,
        "name": "Lovely Lovering"
    },
    "encounterID": 94,
    ...
```
XIVAPI ContentFinderCondition 988:
```
    "ID": 988,
    "Image": "/i/112000/112570.png",
    "ImageID": 112570,
    "ItemLevelRequired": 705,
    ...
    "Name": "AAC Light-heavyweight M2 (Savage)",
```
I think we'll just need a static map

# Abilities and spells
Ability IDs from FFLogs match up with those from XIVApi (https://xivapi.com/Action/<id>)
Buffs/debuffs appear in FFLogs as 100xxxx for some reason, the actual ID (just the xxxx part) is on XIVApi at https://xivapi.com/Status/xxxx

Radius around target is `effectRange` in yalms.

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

# Specific fight notes

## AAC M2S
### Honey B. Live: 1st Beat
Preceded by cast of 37219 at 01:08
Cast on self (1.7s) at 01:10 ->: 01:12
Debuffs applied by Environment at 01:18:
* Unknown (100)3922: 0 stack
* Infatuated 3923: 1 stack
* Head Over Heels 3924: 2 stack
Honey gains Top of the Hive (4143) 01:18

Later we also see
* Hopeless Devotion 3925: 3 stack
* Honey Bee Mine 3926: 4 stack/zombified

### Blinding Love / Love Is Blind
AbilityID is 39629
Timings from fight 8:
* fight start       2589608
* first begincast   2803049
* last cast         2828109
Starts at ~213s in, ends at ~238s

I think there might be a bug in the fflogs collector because it misses some of the begincasts for the Groupbees and assigns them to an instance of Honey B. Lovely instead