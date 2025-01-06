import { Box, Button, Stack } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { Foo } from './-tests';

export const Route = createFileRoute('/test')({
  component: Test
})



function Test() {
  const c = new Foo();
  c.doFoo("dance");
  return <Box>
    Own context:
  </Box>
}