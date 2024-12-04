import { Action } from "../../excel/Action";
import { LocationMatch, Locator } from "../../fflogs/locator";
import { Report, ReportActor } from "../../fflogs/reports";
import { Event, Resources } from "../../fflogs/types";

const eventTypes = ["cast", "begincast", "applydebuff", "removedebuff"] as const;
export type EventType = typeof eventTypes[number];

let nextID = 0;

type ReplayLocation = {
  direct: true;
  x: number;
  y: number;
  facing: number;
  alive: boolean;
} | (
  {
    direct: false;
  } & LocationMatch
)

export type ReplayActorSnapshot = ReportActor & ReplayLocation & {
  instance?: number;
}

interface ReplayEventBase {
  id: number;
  /** Timestamp of the event, as ms since epoch */
  timestamp: number;
  type: EventType;
  action: Action;
  actionType: string;
  source: ReplayActorSnapshot;
  target?: ReplayActorSnapshot;
}

// TODO: May need to make this a union discriminated by type
export type ReplayEvent = ReplayEventBase;

export function fromReport(event: Event, meta: Report, actions: (Action|null)[], locator: Locator): ReplayEvent {
  // Check we support all types
  const {timestamp, type} = event;
  if(!eventTypes.includes(type as EventType)) {
    throw Error(`Unknown event type ${type}`);
  }

  // Get actor information
  function getActorWithLoc(actorID: number|undefined, instance: number|undefined, resources: Resources|undefined, required: true): ReplayActorSnapshot;
  function getActorWithLoc(actorID: number|undefined, instance: number|undefined, resources: Resources|undefined, required?: boolean): ReplayActorSnapshot | undefined;
  function getActorWithLoc(actorID: number|undefined, instance: number|undefined, resources: Resources|undefined, required = false): ReplayActorSnapshot | undefined  {
    if(actorID === undefined || actorID === -1) {
      if(required) throw new Error("Required actor not present");
      else return undefined;
    }
    const actor = meta.actors.find(actor => actor.id === actorID);
    if(actor === undefined) throw new Error(`Failed to find actor ID ${actorID} in meta`);
    if(resources !== undefined) {
      const {x, y, facing} = resources;
      return {
        direct: true,
        ...actor,
        instance,
        x, y, facing,
        alive: resources.hitPoints > 0,
      }
    } else {
      const est = locator.estimateLocation(actorID, event.timestamp, true);
      if(est === null) {
        throw new Error(`Failed to find location for actor ${actorID}`);
      } else {
        return {
          direct: false,
          ...actor,
          instance,
          ...est
        };
      }
    }
  }
  const sourceActor = getActorWithLoc(event.sourceID, event.sourceInstance, event.sourceResources, true);
  const targetActor = getActorWithLoc(event.targetID, event.targetInstance, event.targetResources);

  // Get action
  const action = actions.find(action => action?.["#"] === event.abilityGameID);
  if(action === undefined || action === null) {
    throw new Error(`Failed to find action ID ${event.abilityGameID} in XIV table`);
  }
  const actionType = meta.abilities.find(ability => ability.gameID == event.abilityGameID)?.type;
  if(actionType === undefined){
    throw new Error(`Failed to find action ID ${event.abilityGameID} in metadata`);
  }

  return {
    id: nextID++,
    timestamp,
    type: type as EventType,
    source: sourceActor,
    target: targetActor,
    action,
    actionType,
  };
}