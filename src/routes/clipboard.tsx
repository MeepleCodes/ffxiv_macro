import { Button, Divider, Paper } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router'
import React from 'react';

import { hexDump } from "ffxiv-client-data/common/utils";

export const Route = createFileRoute('/clipboard')({
  component: ClipboardTest
});

function ClipboardTest() {
  const [result, setResult] = React.useState<any>(null);
  const handleSet=() => {
    const data = [
      new ClipboardItem({
        // ["text/plain"]: new Blob([new Uint8Array([0x02, 0x2e, 0x05, 0x38, 0xf2, 0x1c, 0xe9, 0x03])], {type: "text/plain"}),
        // ["text/plain"]: new Blob(["hello \x02\x2e\x05\x38\xf2\x1c\xe9\x03 world"], {type: "text/plain"}) //\x02\x2e\x05\x38\xf2\x1c\xe9\x03,
        ["text/plain"]: new Blob(["Just \x02"], {type: "text/plain"}) //\x02\x2e\x05\x38\xf2\x1c\xe9\x03
      })
    ];
    navigator.clipboard.write(data).then(() => setResult("Clipboard set OK")).catch(e => setResult(e))
  }
  const handleGet=async () => {
    const items = await navigator.clipboard.read();
    const plain = items.find(i => i.types.includes("text/plain"));
    if(plain) {
      const raw = await(await plain.getType("text/plain")).arrayBuffer();
      setResult(hexDump(new DataView(raw)).join("\n"))
    } else {
      setResult(`No text/plain clipboard data, only ${items.map(i => i.types)}`);
    }
  }
  return (
    <Paper sx={{width: 400, height: 400}}>
      <Button
        onClick={handleSet}
       >
        Set clipboard
      </Button>
      <Divider/>
      <Button
        onClick={handleGet}
       >
        Get clipboard
      </Button>
      <hr/>
      {result?.toString()}

    </Paper>
  )
}