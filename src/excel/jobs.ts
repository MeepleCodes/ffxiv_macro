

export const DPSRole = {
  icon: "DPSRole",
  colour: {r: 0x73, g: 0x28, b: 0x28}
} as const;

export const TankRole = {
  icon: "TankRole",
  colour: {r: 0x2d, g: 0x3a, b: 0x80}
} as const;

export const HealerRole = {
  icon: "HealerRole",
  colour: {r: 0x34, g: 0x66, b: 0x24}
} as const;

export const NonCombatRole = {
  icon: undefined,
  colour: {r: 0x80, g: 0x80, b: 0x80}
} as const;

export type Role = typeof DPSRole | typeof TankRole | typeof HealerRole | typeof NonCombatRole;
export const Jobs = {
  "Alchemist": NonCombatRole,
  "Arcanist": DPSRole,
  "Archer": DPSRole,
  "Armorer": NonCombatRole,
  "Astrologian": HealerRole,
  "Bard": DPSRole,
  "BlackMage": DPSRole,
  "Blacksmith": NonCombatRole,
  "BlueMage": DPSRole,
  "Botanist": NonCombatRole,
  "Carpenter": NonCombatRole,
  "Conjurer": HealerRole,
  "Culinarian": NonCombatRole,
  "Dancer": DPSRole,
  "DarkKnight": TankRole,
  "Dragoon": DPSRole,
  "Fisher": NonCombatRole,
  "Gladiator": TankRole,
  "Goldsmith": NonCombatRole,
  "Gunbreaker": TankRole,
  "Lancer": DPSRole,
  "Leatherworker": NonCombatRole,
  "Machinist": DPSRole,
  "Marauder": TankRole,
  "Miner": NonCombatRole,
  "Monk": DPSRole,
  "Ninja": DPSRole,
  "Paladin": TankRole,
  "Pictomancer": DPSRole,
  "Pugilist": DPSRole,
  "Reaper": DPSRole,
  "RedMage": DPSRole,
  "Rogue": DPSRole,
  "Sage": HealerRole,
  "Samurai": DPSRole,
  "Scholar": HealerRole,
  "Summoner": DPSRole,
  "Thaumaturge": DPSRole,
  "Viper": DPSRole,
  "Warrior": TankRole,
  "Weaver": NonCombatRole,
  "WhiteMage": HealerRole
} as const;
export type Job = typeof Jobs[keyof typeof Jobs];