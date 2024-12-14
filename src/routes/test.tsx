import { Box, Button, Stack } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import React from 'react'

export const Route = createFileRoute('/test')({
  component: Test
})



type IDable = {
  id: string
}

type SharedState<T extends IDable> = Record<string, {
  state: T,
  setters: React.Dispatch<React.SetStateAction<T>>[]
}>;

function useSharedStateContext<T extends IDable>() {
  const store = React.useRef<SharedState<T>>({})
  function stateFn(initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const id = initial.id;
    console.log("Created new sharedState from", initial);
    if(!(initial.id in store.current)) {
      console.log("First state for id", initial.id, "setting initial to", initial);
      store.current[initial.id] = {
        state: initial,
        setters: []
      }
    } else {
      initial = store.current[initial.id].state;
      console.log("ID", initial.id, "already exists, using value of", initial);
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [state, setState] = React.useState<T>(initial);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      store.current[id].setters.push(setState);
      console.log("Current listeners for this id now:", store.current[id].setters)
      return () => {
        console.log("Unregistering sharedState for", id);
        const idx = store.current[id].setters.indexOf(setState);
        if(idx === -1) {
          console.warn("My setter isn't in the array?!");
        } else {
          console.log("Removing my setter from idx", idx);
          store.current[id].setters.splice(idx, 1);
        }
      }
    }, [id]);
    
    
    function setAllStates(valueOrSet: React.SetStateAction<T>) {
      const newState: T = typeof valueOrSet === "function" ? valueOrSet(store.current[id].state) : valueOrSet;
      store.current[id].state = newState;
      for(const setter of store.current[id].setters) {
        setter(newState);
      }
    }
    return [state, setAllStates];
  }
  return stateFn;
}

type Thing = {
  id: string,
  value: number
}

const ctx = React.createContext<(initialState: Thing) => [Thing, React.Dispatch<React.SetStateAction<Thing>>]>(React.useState<Thing>);

function ThingOne({thing}: {thing: Thing}) {
  const [state, setState] = React.useContext(ctx)(thing);
  return <Box>
    <Button onClick={() => {
      setState(
        (prevThing: Thing) => {
          const newThing = {...prevThing, value: prevThing.value - 1};
          console.log("Decrementing from", prevThing, "to", newThing);
          return newThing;
        }
      )
    }}
    >
      -1
    </Button>
    {state.value}
    <Button onClick={() => {setState((thing: Thing) => ({id: thing.id, value: thing.value + 1}))}}>
      +1
    </Button>
  </Box>
}

function ThingTwo({thing}: {thing: Thing}) {
  const [state, setState] = React.useContext(ctx)(thing);
  return <Box>
    {state.value}
    <Button onClick={() => {setState({id: state.id, value: 10})}}>
      =10
    </Button>
  </Box>  
}

function Test() {
  const useSharedState = useSharedStateContext<Thing>();
  const [own, setOwn] = React.useState(2);
  const [shared, setShared] = React.useState(2);
  return <Box>
    Own context:
    {new Array(own).fill(undefined).map((_, i) => 
      <ThingOne key = {i} thing={{id: "1", value: 10, owner: "Nobody"} as Thing}/>
    )}
    <Stack direction="row">
      <Button onClick={() => {setOwn(o => Math.max(0, o-1))}}>Remove</Button>
      <Button onClick={() => {setOwn(o => o+1)}}>Add</Button>
    </Stack>
    Shared context:
    <ctx.Provider value={useSharedState}>
      {new Array(shared).fill(undefined).map((_, i) => <Box key={i}>
      <ThingOne thing={{id: "1", value: 0, owner: "ThingOne"} as Thing}/>
      <ThingTwo thing={{id: "1", value: 0, owner: "ThingTwo"} as Thing}/>
      </Box>
      )}
      <Stack direction="row">
        <Button onClick={() => {setShared(o => Math.max(0, o-1))}}>Remove</Button>
        <Button onClick={() => {setShared(o => o+1)}}>Add</Button>
      </Stack>      
    </ctx.Provider>
  </Box>
}