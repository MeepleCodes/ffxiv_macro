export interface Resources {
  x: number;
  y: number;
  facing: number;
  hitPoints: number;
  maxHitPoints: number;
  mp: number;
  maxMP: number;
  tp: number;
  maxTP: number;
}

export interface Event {
  type: string;
  timestamp: number;
  sourceID?: number;
  sourceInstance?: number;
  targetID?: number;
  targetInstance?: number;
  abilityGameID: number;
  extraAbilityGameID?: number;
  fight: number;
  sourceResources?: Resources;
  targetResources?: Resources;
}

export type BeginCast = {
  type: "begincast";
  timestamp: number;
  sourceID: number;
  sourceInstance?: number;
  // Begincasts always have a target, though it's often the same as source
  targetID: number;
  targetInstance?: number;
  abilityGameID: number;
  fight: number;
  duration: number;
}

export type Cast = {
  timestamp: number;
  type: "cast";
  sourceID: number;
  sourceInstance?: number;
  targetID: number;
  targetInstance?: number;
  abilityGameID: number;
  fight: number;
  melee?: true;
  sourceResources?: Resources;
  targetResources?: Resources;
}

export type CastEvent = BeginCast | Cast;


export interface ReportIndex {
  code: string;
  title: string;
  startTime: number;
  endTime: number;
}
export interface Report extends ReportIndex {
  fights: ReportFight[];
  actors: ReportActor[];
  abilities: ReportAbility[];
}

export type ReportActor = {
  // The game ID of the actor.
  gameID: number;
  // An icon to use for the actor. For pets and NPCs, this will be the icon the site
  // chose to represent that actor.
  icon: string;
  // The report ID of the actor. This ID is used in events to identify sources and
  // targets.
  id: number;
  // The name of the actor.
  name: string;
  // The report ID of the actor's owner if the actor is a pet.
  petOwner: number|null;
  // The normalized server name of the actor.
  server: string|null;
  // The sub-type of the actor, for players it's their class, and for NPCs, they are
  // further subdivided into normal NPCs and bosses.
  subType: string;
  // The type of the actor, i.e., if it is a player, pet or NPC.
  type: "NPC" | "Player" | "Pet";
};
export type ReportFight = {
  id: number;
  name: string;
  inProgress: boolean;
  encounterID: number;
  startTime: number;
  endTime: number;
  combatTime: number;
  bossPercentage: number;
  enemyNPCs: ReportFightNPC[];
  friendlyPlayers: number[];
  gameZone: {
    id: number;
    name: string;
  }
};

/**
 * Additional data about an ability that was seen in one or more fights in a
 * report.
 *
 * Adds icon, name (might be wrong) and 'type' to the gameID.
 */
export type ReportAbility = {
  // The game ID of the ability.
  gameID: number;
  // An icon to use for the ability.
  icon: string;
  // The name of the actor.
  name: string;
  // The type of the ability. This represents the type of damage (e.g., the spell
  // school in WoW).
  type: string;
};

/**
 * Abbreviated summary data about an NPC as found in a single fight of a report.
 *
 * To get the full information about the NPC, you need to cross-reference the
 * gameID or ID in the Report Actors list.
 */
export type ReportFightNPC = {
  // The game ID of the actor. This ID is used in events to identify sources and targets.
  gameID: number;
  // The report ID of the actor. This ID is used in events to identify sources and targets.
  id: number;
  // How many instances of the NPC were seen during the fight.
  instanceCount: number;
  // How many packs of the NPC were seen during the fight.
  groupCount: number;
  // The report ID of the actor that owns this NPC (if it is a pet). This ID is used in events to identify sources and targets.
  petOwner: number;
};