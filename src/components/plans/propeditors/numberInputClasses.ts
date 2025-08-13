import { generateUtilityClasses } from "@mui/material";

export interface NumberInputClasses {
  /** Styles applied to the root element. */
  root: string;
  /** Styles applied to the grouping of input and -/+ buttons */
  group: string;
  /** Styles applied to the scrub area containing the label and progress bar */
  scrubArea: string;
  /** Styles applied to the input element */
  input: string;
}


const numberInputClasses: NumberInputClasses = generateUtilityClasses('NumberInput', [
  'root',
  'group',
  'scrubArea',
  'input'
]);

export default numberInputClasses;