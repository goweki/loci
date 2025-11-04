// hooks/useSessionUpdate.ts
import { useSession } from "next-auth/react";

export function useSessionUpdate() {
  const { data: session, update } = useSession();

  const updateSession = async (data: any) => {
    await update(data);
  };

  const refreshSession = async () => {
    await update();
  };

  return { session, updateSession, refreshSession };
}
