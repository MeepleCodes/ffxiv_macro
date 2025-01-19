import { Action } from "../excel/Action"

export type AnalysisMessage = {
  reportCode: string,
  access_token?: string,
  refresh_token?: string
};

export type AnalysisResult = {
  actions: Action[];  
}