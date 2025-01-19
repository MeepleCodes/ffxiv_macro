export const AttackTypes = {
  0: "Unknown",
  1: "斬: Slashing",
  2: "突: Piercing",
  3: "打: Blunt",
  4: "射: Shooting",
  5: "魔法: Magic",
  6: "ブレス: Breath",
  7: "音波: Sound wave",
  8: "リミットブレイク: Limit break",
} as const;

export function attackType(attackType: number): string {
  const name = attackType in AttackTypes ?
    AttackTypes[attackType as keyof typeof AttackTypes] : "Invalid";
  return `${name} (${attackType})`;
}