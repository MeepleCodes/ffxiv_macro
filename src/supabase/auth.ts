import React from "react";
import supabase from "./client";
import { Session } from "@supabase/supabase-js";

export function useSession() {
  const [session, setSession] = React.useState<Session|null>(null);

  React.useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {subscription.unsubscribe()}
  }, []);
  return session;
}