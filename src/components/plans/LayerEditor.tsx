import { RichTreeView } from "@mui/x-tree-view/RichTreeView"
import { Plan } from "./schemas"
import { PlanChanger } from "./editable"

export type LayerEditorProps = {
  plan: Plan,
  changers: PlanChanger,
  page: number,
  arena: number,
  selection: Set<string>,
  setSelection: React.Dispatch<React.SetStateAction<Set<string>>>  
}

export default function LayerEditor(props: LayerEditorProps) {
  const {plan, page, arena, selection, setSelection} = props;
  return <RichTreeView
    items={plan.pages[page].arenas[arena].layers}
    getItemLabel={(item) => item.name}
    multiSelect
    selectedItems={selection.values().toArray()}
    onSelectedItemsChange={(_, itemIds) => {setSelection(new Set(itemIds))}}
  />
}