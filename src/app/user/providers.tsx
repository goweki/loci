"use client";
import Link from "next/link";
import { createContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Loader from "@/components/atoms/loader";
import toast from "react-hot-toast";
import { httpStatusCodes } from "@/lib/configs";
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
      const response = await fetch(`/api/user/data`).then(async (res_) => {
        if (res_.ok) {
          return await res_.json();
        } else {
          console.error(
            "failed to fetch data - ",
            res_.status,
            "\n >> ",
            await res_.json()
          );
          toast.error(httpStatusCodes[res_?.status] ?? "Unknown error");
        }
      });

      if (response.success) {
        console.log("RESPONSE - ", response.success);
        setData(response.success);
      } else {
        console.error("bad response - ", response);
        setData("failed");
        return;
      }
    } catch (err) {
      setData("failed");
      console.error("ERROR: caught error\n > " + err);
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
