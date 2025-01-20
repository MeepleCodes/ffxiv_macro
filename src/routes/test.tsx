import { Box, Button, Stack } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { Foo } from './-tests';
import supabase from '../supabase/client';

export const Route = createFileRoute('/test')({
  component: Test,
  loader: async () => supabase.rpc("bytea_test")
})



function Test() {
  const data = Route.useLoaderData();
  console.log("Returned", data);
  return <Box>
    Data: {JSON.stringify(data)}
  </Box>
}