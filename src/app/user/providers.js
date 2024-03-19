"use client";
import Link from "next/link";
import { createContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Loader from "@/components/atoms/loader";
export const DataContext = createContext();

export default function Providers({ children }) {
  const { data: session, status } = useSession();
  const [data, setData] = useState(null);
  // func update UI data
  //   const fetchUIuserData = useCallback(async () => {
  //     try {
  //       const fetchOptions = {
  //         method: "GET",
  //       };

  //       const response = await fetch(
  //         `/api/user/data?institution=${Object.keys(session.user.role)[0]}`,
  //         fetchOptions
  //       );

  //       if (!response.ok) {
  //         throw new Error(`Failed to fetch data. Status: ${response.status}`);
  //       }

  //       const json_ = await response.json();

  //       if (json_.success) {
  //         setData(json_.success);
  //       } else {
  //         console.error(
  //           "FAILED: could not fetch data\n > " +
  //             JSON.stringify(json_.error ?? "....")
  //         );
  //         setData("failed");
  //       }
  //     } catch (err) {
  //       setData("failed");
  //       console.error("ERROR: caught error\n > " + err);
  //     }
  //   }, [session?.user?.role]);

  // onMount
  useEffect(() => {
    if (session) {
      //   fetchUIuserData();
    }
  }, [
    session,
    // , fetchUIuserData
  ]);

  //render
  return !session ||
    //   || !data
    status === "loading" ? (
    <Loader />
  ) : data === "failed" ? (
    <div>
      <p className="text-center">
        There was an error loading the contents of this page. Check internet
        connectivity
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
        data,
        // refreshData: fetchUIuserData
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
