import { Tooltip, Typography } from "@mui/material";
import React from "react";
import { Action } from "../../excel/Action.types";
import TextLabel from "./TextLabel";
import { CastTypeLabels } from "../../excel/casts";
import LabelValue from "./LabelValue";
import { ActionCategories, actionCategory } from "../../excel/ActionCategory";
import { attackType } from "../../excel/AttackType";

export type ActionTooltipProps = {
  action: Action
}


const ActionTooltip = React.memo(function ActionTooltipInner(props: ActionTooltipProps) {
  const {action, ...rest} = props;
  const name = action.name === "" ? `Unknown (${action.id})` : action.name;
  return (
    <Tooltip
      enterDelay={500}
      title={<>
        <Typography variant="overline" lineHeight="inherit" component="p" textAlign="right"><TextLabel>ID</TextLabel>{action.id}</Typography>
        <Typography variant="h6">{name}</Typography>
        <LabelValue
          variant="caption"
          label="Type"
          value={`${CastTypeLabels[action.castType]} (${action.castType})`}
        />
        <LabelValue
          variant="caption"
          label="Category"
          value={actionCategory(action.actionCategory)}
        />
        <LabelValue
          variant="caption"
          label="Attack type"
          value={attackType(action.attackType)}
        />
        {action.range > 0 && <LabelValue
          variant="caption"
          label="Range"
          value={`${action.range} yalms`}
        />}
        {action.effectRange > 0 && <LabelValue
          variant="caption"
          label="Effect range"
          value={`${action.effectRange} yalms`}
        />}
        {action.xAxisModifier > 0 && <LabelValue
          variant="caption"
          label="Effect width"
          value={`${action.xAxisModifier} yalms`}
        />}

      </>}
      {...rest}
    >
      <Typography
        fontWeight="bold"
        variant="body2"
        component="span"
      >
        {name}
      </Typography>
    </Tooltip>
  )
});
export default ActionTooltip;