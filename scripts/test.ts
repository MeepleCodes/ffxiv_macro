import { readFileSync } from "fs";
import { parseActionsCSV } from "../src/excel/Action";

const csvPath = "./dat/Action.csv";
const actions = parseActionsCSV(readFileSync(csvPath));

for(const actionID of [1, 10000, 36754]) {
  console.log(`actions[${actionID}].# = ${actions.at(actionID)?.["#"]}`);
}