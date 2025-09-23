"use client";
import Link from "next/link";
import { createContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Loader from "@/components/ui/loaders";
import toast from "react-hot-toast";
export const DataContext = createContext<{
  data: Record<string, any>;
  refreshData: () => void;
}>({
  data: {},
  refreshData: () => {},
});

export default function Providers({ children }) {
  const { data: session, status } = useSession();
  const [data, setData] = useState("loading");
  // func update UI data
  const fetchUIuserData = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/user/data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // avoid stale data, adjust depending on use case
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("API Error:", json.error || "Unknown error");
        toast.error(json.error || "Failed to fetch user data");
        setData("failed");
        return;
      }

      setData(json.data); // ✅ access parsed body, not `res.data`
    } catch (err) {
      console.error("ERROR: caught error\n >", err);
      toast.error("Something went wrong while fetching user data");
      setData("failed");
    }
  }, [session?.user]);

  // fetch UI data
  useEffect(() => {
    fetchUIuserData();
  }, [fetchUIuserData]);

  //render
  return data === "loading" || status === "loading" ? (
    <div className="flex items-center justify-center m-auto">
      <Loader />
    </div>
  ) : data === "failed" ? (
    <div className="flex flex-col flex-grow items-center justify-center">
      <p className="text-center">
        There was an error loading the contents of this page. Check internet
        connectivity or try again later.
      </p>
      <p className="text-center">
        <Link href="/" className="text-red-800 dark:text-red-400 underline">
          click here{" "}
        </Link>
        to go to homepage
      </p>
    </div>
  ) : (
    <DataContext.Provider
      value={{
        data: typeof data === "object" ? data : {},
        refreshData: fetchUIuserData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
