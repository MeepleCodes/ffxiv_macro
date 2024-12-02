import React from "react";
import { ExtraOutletContext } from "./ExtraOutletContext";

export function ExtraRoute({children}: React.PropsWithChildren) {
  const setChildren = React.useContext(ExtraOutletContext);
  React.useEffect(() => {
    if(setChildren) setChildren(children);
    return () => {setChildren && setChildren(undefined)};
  }, [setChildren, children]);
  return false;
}