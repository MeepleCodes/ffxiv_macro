import { LocationMatch, Locator } from "../../analysis/locator";
import { ActorInstance, Event, EventTypes } from "../../analysis/types";
import { Action } from "../../excel/Action.types";
import { CastType } from "../../excel/casts";

export type LocatedActorInstance = ActorInstance & {
  location: LocationMatch|null
}

/**
 * Extension of event that includes the location of the source and target actors.
 * 
 * Location of each is calculated the first time they're requested and cached
 * for subseequent lookups.
 */
export class LocatedEvent {
  public readonly id: number;
  public readonly timestamp: number;
  public readonly type: EventTypes;
  private readonly unlocatedSource: ActorInstance;
  private locatedSource: LocatedActorInstance|null = null;
  private readonly unlocatedTarget?: ActorInstance;
  private locatedTarget: LocatedActorInstance|null = null;
  public readonly ability: Action;
  constructor(event: Event, private locator: Locator){
    this.id = event.id
    this.timestamp = event.timestamp;
    this.type = event.type;
    this.unlocatedSource = event.source;
    this.unlocatedTarget = event.target;
    this.ability = event.ability;
  }
  public get source(): LocatedActorInstance {
    if(this.locatedSource === null) {
      this.locatedSource = {
        ...this.unlocatedSource, 
        location: this.locator.estimateLocation(this.unlocatedSource.id, this.unlocatedSource.instance, this.timestamp, true)
      };
    }
    return this.locatedSource;
  }

  public get target(): LocatedActorInstance | undefined {
    if(this.locatedTarget === null) {
      if(this.unlocatedTarget !== undefined) {
        this.locatedTarget = {
          ...this.unlocatedTarget, 
          location: this.locator.estimateLocation(this.unlocatedTarget.id, this.unlocatedTarget.instance, this.timestamp, true)
        };
      }
    }
    return this.locatedSource ?? undefined;
  }

  // public renderable(): boolean {
  public renderable(): this is RenderableEvent {
    switch(this.ability.castType) {
      case CastType.TargetableCircle:
      case CastType.ChargeRectangle:
      case CastType.Donut:
      case CastType.Cross:
      case CastType.Rectangle:
      case CastType.Cone:
        return this.source.location !== null;
      default: return false;
    }
  }
}


export type RenderableActorInstance = ActorInstance & {
  location: LocationMatch
}

export type RenderableEvent = LocatedEvent & {
  readonly source: RenderableActorInstance;
  readonly ability: Action & {
    castType: typeof CastType.TargetableCircle | 
              typeof CastType.ChargeRectangle | 
              typeof CastType.Donut |
              typeof CastType.Cross |
              typeof CastType.Rectangle |
              typeof CastType.Cone
  }
}