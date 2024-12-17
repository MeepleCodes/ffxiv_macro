import { getRouteApi, Link, useParams } from "@tanstack/react-router";
import React from "react";
import {Route as MacroIDRoute} from './macro/$macroID';
import { Route as NewMacroRoute } from './macro';

export default function MacroTest() {
  const renders = React.useRef(0);
  renders.current++;
  const {macroID} = useParams({strict: false});
  return <div>
    <p>
      Hello /macro/{macroID}! I have been rendered {renders.current} times.
    </p>
    <textarea style={{
      width: 500,
      height: 200
    }} defaultValue="Some text not synced with the component"/>
    <p>
      <Link to={NewMacroRoute.to} replace={true}>Change to new</Link>
      <Link to={MacroIDRoute.to} replace={true} params={{macroID: "10"}}>Change ID to 10</Link>
      <Link to={MacroIDRoute.to} replace={true} params={{macroID: "1"}}>Change ID to 1</Link>
    </p>
  </div>
}