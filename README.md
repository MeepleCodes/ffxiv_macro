# FFXIV Macro Viewer

## Copy/pasting from the game
Any regular text is copy/pasted as type text/plain, as you'd expect.

Copying text containing a link/autocomplete from the game client puts the plain text representation on the system clipboard, but clearly stores the real data including payloads somewhere in the client's memory.

Externally setting the clipboard to contain \x02 somewhere in the text and pasting into the client causes it to insert the contents of its internal "text with payloads" buffer regardless of what's in the system clipboard, which will notable produce nothing at all if haven't previously copied in-game (TODO: test whether it's actually always using the internal buffer).

I'm not sure how it tells when you've copied a payload-containing string in the client, then copied another string from outside the game - I can see no obvious difference in what's in the buffers, even at the win32 level. Maybe it's listening to system clipboard events?

# Drawings
Drawing is shared between Analysis and Plans, both of which use the drawing components to render something.

So a drawing part is just the visual Component. We should probably bake a UID
into this part though because it needs to use it for key props.

* Arena: bgimage, bgscale
* Actor: x, y, facing, size, text
  * PlayerActor: job, square/round
  * EnemyActor: draws a hitbox instead; could do icons too maybe?
* AoE: x, y, colour, opacity
  * Cone: facing, distance, angle
  * Donut: rIn, rOut
  * Circle: radius
  * etc
* Tether: x1, y1, x2, y2, style, width

# Plans and animations
You can have parts that are just a direct mapping of a drawing part (e.g. "a
green donut at 100, 100") but then we also want:

* Attached parts. These need a way to handle what they're referencing in a way
  that updates properly via React
  * Players with range circles
  * Tethers have *two* attach targets
* Update self: drag/drop, but also context menus
* Editor pane needs to update the state of the referenced object at a distance

Do we need runtime property typing? I'm leaning yes:

* Can add validation
* Could automatically build the editor out of kit parts

I think we can achieve most of this by having:

* A mapping of of Zod type to component def
  * Could be a carefully typed record type
  * Or a component with a switch() block in the render
* Context that gives access to the top-level plan object
* Make canEdit a context, nice and easy way to have the inactive layer/groups turn off editing for their children
* onChange and onChildChange events for every element (?)
* The Plan can have an index of id -> part to update its master tree structure, but that won't trigger prop redraws because the root object won't change (so the props on every leaf node may get stale, but that's okay because they're throwing them straight into a useEditable())
* A usePartRef hook that tells the plan 'register/unregister for changes to `ref`'
  * useState, pass the setX back to plan, return the X to caller
  * This works fine, but the context holder has to be the authority on the 'current' state of a given ID. What happens if all consumers of that ID remove themselves - should we also stop remembering the 'current' state of that part? It's also storing everything in a ref so it won't get reset under most circumstances - want to make sure that things like loading a different document (that might shared IDs) resets the state.
  * I think that means "all consumers removed => remove state from ref" is probably sensible, but also we might want to make sure IDs are truly unique otherwise React might do weird things.
  * Maybe 'current state of item' is set by the *last* consumer, not the first, so it doesn't matter? It does mean the 'master document' needs to make sure it's updated/is a consumer otherwise changes would get overwritten, but that may make more sense.
    * This can't call all the setters, though, because that would be updating state during render. Hmm...
  * OR: the context version has to pre-populate the ref'd map with the 'current state', and everything gets whatever was already in the map (ignoring whatever they pass in for `initial`) - this might be the best answer

Who needs to know what...

* Part rendering components need to know when the part state changes, and may also change it (e.g. for drag/drop)
* Part editing sidebar components likewise
* Referencing components need to know when their reference target changes or is deleted
* Groups need to know when their children are deleted (this is what triggers the tree update by removing a node from the children array)
* Components may need to know when they're deleted, so they can cascade to children and fire their onDeleted just in case there's a remote reference to one of them

## Selections and transforming/grouping
Konva has a Transformer tool (needs a bit of imperative code) which works by tweaking scaleX/Y, so hopefully we could use that.

Grouping is:

* Remove all objects in selection from their current parent (will it be the same parent? I think it has to be...)
* Create a new group under that parent
* Put the objects back in the new group
* Select the group

## Animated plans
Are multi-screen plans *with shared parts* a subset of an animated plan? Kindof...
* Can't set lerp
* Frames become Pages
* Flip the UI around so it's working on pages and has a list of layers>parts in the sidebar

Structure goes:
* Plan
  * Timeline[]
    * Keyframe[]

Timelines can be manual ones, in which case they're something like

* Part (e.g. Player, Enemy, Marker)
  * PropKeyframe[]
    * Time/frame (cast times are in increments of 100ms so we can probably do 0.1s frames)
    * Property
    * New value
    * Lerp (boolean, could add ease functions later I guess)

Or presets, like a cast which is
* Marker
* Omen time
* Fade-out time

And gets converted under the hood into

* Park: Marker
* PropKeyframe[]
  * Startcast
    * Time: t-casttime
    * Color: orange
    * Opacity: 0.5
  * Cast
    * Time: casttime
    * Color: red, lerp: false
    * Opacity: 1.0
  * Fadeout
    * Time: casttime+fade-out
    * Opacity: 0.0
    * Visible: false

How do we disable fadeout on casts? I think it has to be "time: casttime+0.1", "opacity: 0.0, lerp: false"

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

