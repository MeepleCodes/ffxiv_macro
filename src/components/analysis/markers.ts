/**
 * Hand-crafted cone angle and donut inner radiuses for event markers
 */
export const ConeAngles = {
  37277: 90, // Cone TB in AAC M2S
  37299: 45, // Cones in xstage Combo in AAC M2S
  37886: 270, // Murderous Mist in AAC M3S
  // AAC M3S Infernal Spins (various)
  39855: 60,
  39856: 60,
  37918: 60,
  
};

export function guessConeAngle(actionID: number): number {
  return actionID in ConeAngles ? ConeAngles[actionID as keyof typeof ConeAngles] : 45  
}

export const DonutRadii = {
  37300: 7, // Donut in xstage Combo in AAC M2S
   // Explosive Rain donuts in AAC M3S
  37912: 15,
  37914: 8,
  37915: 16,
}
export function guessDonutRadius(actionID: number): number {
  return actionID in DonutRadii ? DonutRadii[actionID as keyof typeof DonutRadii] : 5  
}

export type PlayerIcon = typeof PlayerIcons[number];
export const PlayerIcons = [
  "Alchemist",
  "Arcanist",
  "Archer",
  "Armorer",
  "Astrologian",
  "Bard",
  "BlackMage",
  "Blacksmith",
  "BlueMage",
  "Botanist",
  "Carpenter",
  "Conjurer",
  "Culinarian",
  "Dancer",
  "DarkKnight",
  "DPSRole",
  "Dragoon",
  "Fisher",
  "Gladiator",
  "Goldsmith",
  "Gunbreaker",
  "HealerRole",
  "Lancer",
  "Leatherworker",
  "Machinist",
  "Marauder",
  "Miner",
  "Monk",
  "Ninja",
  "Paladin",
  "Pictomancer",
  "Pugilist",
  "Reaper",
  "RedMage",
  "Rogue",
  "Sage",
  "Samurai",
  "Scholar",
  "Summoner",
  "TankRole",
  "Thaumaturge",
  "Viper",
  "Warrior",
  "Weaver",
  "WhiteMage",
  ];