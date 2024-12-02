import React from "react";
import { ExtraOutletContext } from "./ExtraOutletContext";

export function useExtraOutlet() {
  const [children, setChildren] = React.useState<React.ReactNode>(undefined);
  const ExtraOutlet = React.useCallback(() => {
    return children;
  }, [children]);
  const Provider = React.useCallback(({children}: {children: React.ReactNode}) => 
    <ExtraOutletContext.Provider value={setChildren}>
      {children}
    </ExtraOutletContext.Provider>
  , [setChildren]);
  return {
    ExtraOutlet,
    Provider
  }
}
