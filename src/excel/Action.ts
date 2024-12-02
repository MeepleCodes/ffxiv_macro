// import { CastingContext } from "csv-parse";
// import { parse } from "csv-parse/sync";

import { RowType } from "./excel";

export const ActionKeys = ["#","Name","","Icon","ActionCategory","","Animation{Start}","VFX","Animation{End}","ActionTimeline{Hit}","","ClassJob","BehaviourType","ClassJobLevel","IsRoleAction","Range","CanTargetSelf","CanTargetParty","CanTargetFriendly","CanTargetHostile","","","TargetArea","","","","CanTargetDead","","CastType","EffectRange","XAxisModifier","","PrimaryCost{Type}","PrimaryCost{Value}","SecondaryCost{Type}","SecondaryCost{Value}","Action{Combo}","PreservesCombo","Cast<100ms>","","Recast<100ms>","CooldownGroup","AdditionalCooldownGroup","MaxCharges","AttackType","Aspect","ActionProcStatus","","Status{GainSelf}","UnlockLink","ClassJobCategory","","","AffectsPosition","Omen","","IsPvP","","","","","","","","","","","","IsPlayerAction",""] as const;
export const ActionTypes = ["int32","str","bit&01","Image","ActionCategory","byte","ActionCastTimeline","ActionCastVFX","ActionTimeline","ActionTimeline","byte","ClassJob","byte","byte","bit&02","sbyte","bit&04","bit&08","bit&10","bit&20","bit&40","bit&80","bit&01","bit&02","bit&04","sbyte","bit&08","bit&10","byte","byte","byte","bit&20","byte","uint16","byte","Row","Action","bit&40","uint16","byte","uint16","byte","byte","byte","AttackType","byte","ActionProcStatus","byte","Status","Row","ClassJobCategory","byte","bit&80","bit&01","Omen","uint16","bit&02","bit&04","bit&08","bit&10","bit&20","bit&40","bit&80","bit&01","bit&02","byte","bit&04","bit&08","bit&10","byte"] as const;

export type Action = RowType<typeof ActionKeys, typeof ActionTypes>;
// type KeyIndex = Exclude<keyof typeof keys, keyof []>;
// type types = {
//   [key in keyof typeof raw_types]: 
//     typeof raw_types[key] extends bitfield ? 
//       boolean : 
//       typeof raw_types[key] extends "str" ?
//         string :
//         number;
// }

// type bitfield = `bit&${0|1|2|3}${0|1|2|3|4|5|6|7|8|9}`
// export type Action = {
//   [key in KeyIndex as typeof keys[key] extends "" ? never : typeof keys[key]]: types[key];
// }
// export const ActionColumns = keys.map(key => key === "" ? undefined : key);
// export const ActionCast = function(value: string, context: CastingContext) {
//   const typeName = raw_types.at(context.index);
//   if(typeName === "str" || typeName === undefined) {
//     return value;
//   } else if(typeName.startsWith("bit&")) {
//     return value === "True"
//   } else {
//     try {
//       return parseInt(value, 10);
//     } catch {
//       return value;
//     }
//   }
// }

// export function parseActionsCSV(data: string | Buffer) {
//   return parse(data, {columns: ActionColumns, cast: ActionCast, from_line: 4}) as Array<Action>;
// }