/**
 * Additional data about casts and AoE markers
 */

/**
 * Enumeration of the values in Action.CastType.
 *
 * The range of many AoEs is derived from Action.EffectRange and/or
 * XAxisModifier. For some CastTypes, the actual range of the AoE is measured
 * from the edge of the source's hitbox (ie Action.EffectRange +
 * Source.HitBoxRadius). These types are noted as "range includes hitbox radius"
 * below.
 */
export const CastType = {
  Unknown: -1,
  /** Probably melee attacks */
  Unknown1: 1,
  /** A circle that can target self or another */
  TargetableCircle: 2,
  /** Cone, range includes hitbox radius. Cone angle isn't available. */
  ConeFromHitbox: 3,
  /** Rectangle (forward or forward+backward?), range includes hitbox radius */
  RectangleFromHitbox: 4,
  /** A PBAE circle from the source, the radius includes hitbox radius */
  PBCircleFromHitbox: 5,
  /** Speculated to be circle AEs that resolve invisibly */
  InvisibleCircle: 6,
  /** Player ground-targetted abilities such as healer domes */
  PlayerTargetableCircle: 7,
  /** Rectangle but charging target - in theory this should clamp range to target but it's used for AAM2S bees so ???*/
  ChargeRectangle: 8,
  /** Nobody knows */
  Unknown9: 9,
  /** Donut. Inner radius isn't available */
  Donut: 10,
  /** Cross extending EffectRange from source (range doesn't include hitbox) */
  Cross: 11,
  /** Rectangle (forward? forward+backward?)*/
  Rectangle: 12,
  /** Cone. Angle isn't available. */
  Cone: 13
} as const;
export type CastType = typeof CastType[keyof typeof CastType];
// export enum CastType {
//   Unknown = -1,
//   /** Probably melee attacks */
//   Unknown1 = 1,
//   /** A circle that can target self or another */
//   TargetableCircle = 2,
//   /** Cone, range includes hitbox radius. Cone angle isn't available. */
//   ConeFromHitbox = 3,
//   /** Rectangle (forward or forward+backward?), range includes hitbox radius */
//   RectangleFromHitbox = 4,
//   /** A PBAE circle from the source, the radius includes hitbox radius */
//   PBCircleFromHitbox = 5,
//   /** Speculated to be circle AEs that resolve invisibly */
//   InvisibleCircle = 6,
//   /** Player ground-targetted abilities such as healer domes */
//   PlayerTargetableCircle = 7,
//   /** Rectangle but charging target - in theory this should clamp range to target but it's used for AAM2S bees so ???*/
//   ChargeRectangle = 8,
//   /** Nobody knows */
//   Unknown9 = 9,
//   /** Donut. Inner radius isn't available */
//   Donut = 10,
//   /** Cross extending EffectRange from source (range doesn't include hitbox) */
//   Cross = 11,
//   /** Rectangle (forward? forward+backward?)*/
//   Rectangle = 12,
//   /** Cone. Angle isn't available. */
//   Cone = 13
// }
export const CastTypeLabels = Object.fromEntries(Object.entries(CastType).map(([str, num]) => [num, str]));
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
  37911: 8,
  37912: 16,
  37914: 8,
  37915: 16,
  // Thundering during Widening/Narrowing Witch Hunt, AACM4S
  19730: 10
}
export function guessDonutRadius(actionID: number): number {
  return actionID in DonutRadii ? DonutRadii[actionID as keyof typeof DonutRadii] : 5  
}

/**
 * CastType Rectangle (12) actions where the rectangle is centered lengthways on
 * the caster rather than extending forward from their location.
 */
export const ThroughRectangles: number[] = [
  // Mouser squares, AAC M1S
  38054,
  // Honey Beeline, AAC M2S
  39625, // Notably *not* square
  // Lightning Cage from AAC M4S
  38351,
  // Spark, Spark II (twice), Spark III from AAC M4S
  38345, 38346, 38347, 38348
] as const;

// Forward examples: 38377 (Bewitching Flight, AAC M4S), 39629 (Blinding Love, AAC M2S)