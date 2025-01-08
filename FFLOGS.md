# FFLogs and other data sources
Notes on extracting data about a fight, mostly from FFLogs but with reference to XIV client data and/or XIVAPI.

# Background images
https://cf.raidplan.io/raid/ff.aac1/map/01.r1-main.jpg

# FFLogs
FFLogs's own UI uses a "cast-events" data source to get a list of events with "childEvent" arrays (the damage done by a cast when it lands); this doesn't seem to be available through the GraphQL API which sucks.

You also don't get worldMarkers in the ReportData > report > fights array, and I don't see any place to get those via the API.

As of 08/01/2025 there seems to be a bug in the fflogs V2 API, as it's returning `_rsv_13059_-1_1_0_0_S64755250_E64755250` as the name for the turrents in M4S, which is unhelpful. The V1 API correctly names them as `Gun Battery` so maybe we need to try the V1 API out for a bit...

## V1
The documented schema seems incomplete or just wrong, so...

### report/fights/{{reportID}}
```typescript
{
    "lang": string,
    "fights": [
        {
            "id": 1,
            "boss": 95, // 'encounterID' in V2
            "start_time": 3909655,
            "end_time": 4453162,
            "name": "Brute Bomber",
            // gameZone.id in V2
            "zoneID": 1230,
            // Not included in V2 (you only get the map name)
            "zoneName": "AAC Light-heavyweight M3 (Savage)",
            // No idea what this maps to
            "zoneCounter": 3,
            "size": 8,
            "difficulty": 101,
            "kill": false,
            "partial": 0,
            "inProgress": false,
            "standardComposition": true,
            "hasEcho": false,
            "hasTrustNPCs": false,
            "combatTime": 542486,
            "bossPercentage": 2448,
            "fightPercentage": 2448,
            "lastPhaseAsAbsoluteIndex": 0,
            "lastPhaseForPercentageDisplay": 0,
            "maps": [
                {
                    // Not present in V2
                    "mapID": 926,
                    // gameZone.name in V2
                    "mapName": "Blasting Ring",
                    // Not present in V2
                    "mapFile": "m-x6r3-x6r3.00.jpg"
                }
            ]
        },
        //... etc
    ],
    "friendlies": [
        {
            "name": "Player Name",
            "id": 80,
            "guid": 1000080,
            // This is the subType of a v2 actor
            "type": "Monk",
            "server": "Cerberus",
            "icon": "Monk",
            "fights": [
                {
                    "id": 1
                },
                {
                    "id": 2
                },
                // ... etc
            ]
        },
        // ... etc
    ],
    "enemies": [
        {
            "name": "Brute Bomber",
            "id": 93,
            "guid": 2000093,
            // This is the subType of a v2 actor
            "type": "NPC",
            "icon": "NPC",
            "fights": [
                {
                    "id": 1,
                    "instances": 12,
                    "groups": 8
                },
                {
                    "id": 2,
                    "instances": 12,
                    "groups": 10
                },
                // ... etc
            ]
        },
        // ...etc
    ],
    "friendlyPets": [
        {
            "name": "Demi-Phoenix",
            "id": 98,
            "guid": 10488,
            "type": "Pet",
            "icon": "abilities/002000-002765.png",
            "petOwner": 82,
            "fights": [
                {
                    "id": 1,
                    "instances": 2
                },
                //...etc
            ]
        },
        //...etc
    ],
    "enemyPets": [],
    "logVersion": 67,
    "gameVersion": 1,
    "phases": [],
    "title": "AAC Light-Heavyweight",
    "owner": "<their display name in fflogs>",
    "start": 1736277103560,
    "end": 1736286057986,
    "zone": 62,
    "exportedCharacters": [
        {
            "id": `<global id? a number>`,
            "name": "Player Name",
            "server": "Cerberus",
            "region": "EU"
        },
        //...etc
    ]
}
```

### report/events/casts/{{reportID}}
Relevant querystring params: start={{timestamp}}, end={{timestamp}}, hostility=1

The response format seems to be basically the same as V2 except:
* If there's no target (targetID -1 in V2), it will instead have `target` object for the Environment/-1 target
* Addition of the `sourceIsFriendly`/`targetIsFriendly` booleans

```typescript
{
  "events": [
    {
      "timestamp": 8909231,
      "type": "cast",
      "sourceID": 114,
      "sourceInstance": 1,
      "sourceIsFriendly": false,
      "target": {
        "name": "Environment",
        "id": -1,
        "guid": 0,
        "type": "NPC",
        "icon": "NPC"
      },
      "targetIsFriendly": false,
      "ability": {
        "name": "Electray",
        "guid": 38379,
        "type": 1024,
        "abilityIcon": "000000-000405.png"
      },
      "fight": 11,
      "sourceResources": {
        "hitPoints": 18830000,
        "maxHitPoints": 18830000,
        "mp": 10000,
        "maxMP": 10000,
        "tp": 0,
        "maxTP": 0,
        "x": 8000,
        "y": 11250,
        "facing": -629
      }
    },
    //...
    {
      "timestamp": 8913773,
      "type": "begincast",
      "sourceID": 113,
      "sourceInstance": 4,
      "sourceIsFriendly": false,
      "targetID": 113,
      "targetInstance": 4,
      "targetIsFriendly": false,
      "ability": {
        "name": "Burst",
        "guid": 38378,
        "type": 1024,
        "abilityIcon": "000000-000405.png"
      },
      "fight": 11,
      "duration": 5700
    },    
    //...etc
  ]
  "count": 56,
  "auraAbilities": []
}
```

# Coordinate system
Timestamps are in ms; the start/end times of a report are since epoch, but
timestamps for fights and events within a fight are since the start of the
containing report.

## Locations
FFLogs 2D coordinates are x=horizontal, y=vertical, starting from the top-left
corner and drawing down and right.

The raw values are in units of 0.01 yalm; the coordinates they show on the
replay are in yalms. The arena centre tends to be at 100,100; no idea if that's
an FFLogs adjustment or what the actual game does.

## Facings
FFLog values are in units of 0.01rad CW starting from east, they all seem to be
between -PI and -3PI for... reasons but you can modulo that out.
* -786 (-2.5 PI, -90d) is north
* -315 (-1 PI, -180d) is west
* -629 (-2 PI, -0d) is east - note the correct value would be -628 so either it wasn't facing directly east or there's a rounding error somewhere
* -472 (-1.5 PI, -270d) is south

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