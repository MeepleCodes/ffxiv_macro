// import { CastingContext } from "csv-parse";
// import { parse } from "csv-parse/sync";

import { RowType } from "./excel";

export const ActionKeys = ["#","Name","","Icon","ActionCategory","","Animation{Start}","VFX","Animation{End}","ActionTimeline{Hit}","","ClassJob","BehaviourType","ClassJobLevel","IsRoleAction","Range","CanTargetSelf","CanTargetParty","CanTargetFriendly","CanTargetHostile","","","TargetArea","","","","CanTargetDead","","CastType","EffectRange","XAxisModifier","","PrimaryCost{Type}","PrimaryCost{Value}","SecondaryCost{Type}","SecondaryCost{Value}","Action{Combo}","PreservesCombo","Cast<100ms>","","Recast<100ms>","CooldownGroup","AdditionalCooldownGroup","MaxCharges","AttackType","Aspect","ActionProcStatus","","Status{GainSelf}","UnlockLink","ClassJobCategory","","","AffectsPosition","Omen","","IsPvP","","","","","","","","","","","","IsPlayerAction",""] as const;
export const ActionTypes = ["int32","str","bit&01","Image","ActionCategory","byte","ActionCastTimeline","ActionCastVFX","ActionTimeline","ActionTimeline","byte","ClassJob","byte","byte","bit&02","sbyte","bit&04","bit&08","bit&10","bit&20","bit&40","bit&80","bit&01","bit&02","bit&04","sbyte","bit&08","bit&10","byte","byte","byte","bit&20","byte","uint16","byte","Row","Action","bit&40","uint16","byte","uint16","byte","byte","byte","AttackType","byte","ActionProcStatus","byte","Status","Row","ClassJobCategory","byte","bit&80","bit&01","Omen","uint16","bit&02","bit&04","bit&08","bit&10","bit&20","bit&40","bit&80","bit&01","bit&02","byte","bit&04","bit&08","bit&10","byte"] as const;

export type Action = RowType<typeof ActionKeys, typeof ActionTypes>;
