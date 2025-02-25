"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from 'next/navigation'
import { DataContext } from "@/app/user/providers";
import { CardDataStats } from "@/components/mols/cardsData";

export default function UserSummary() {
  const { data, refreshData } = useContext(DataContext);
  const [parsedData, setData] = useState("");
  const router = useRouter()

  useEffect(() => {
    if (data.length > 0) {
      const devices = data[0].devices;
      // device types
      const cameras = devices.filter(
        ({ deviceType }) => deviceType === "camera"
      );
      const fences = devices.filter(({ deviceType }) => deviceType === "fence");
      const accesscontrols = devices.filter(
        ({ deviceType }) => deviceType === "access-control"
      );

      // unreads notifications
      const cameraUnreads = cameras.reduce((acc, v) => {
        const unreads = v.notifications.filter(({ read }) => !read);
        return [...acc, ...unreads];
      }, []);
      const fenceUnreads = fences.reduce((acc, v) => {
        const unreads = v.notifications.filter(({ read }) => !read);
        return [...acc, ...unreads];
      }, []);
      const accessconUnreads = accesscontrols.reduce((acc, v) => {
        const unreads = v.notifications.filter(({ read }) => !read);
        return [...acc, ...unreads];
      }, []);

      setData({
        installations: {
          cameras: cameras.length,
          fences: fences.length,
          accesscontrols: accesscontrols.length,
        },
        notifications: {
          cameras: cameraUnreads.length,
          fences: fenceUnreads.length,
          accesscontrols: accessconUnreads.length,
        },
      });
    }
  }, [data]);

  if (parsedData)
    return (
      <div className="w-full grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        <CardDataStats
          className={`hover:scale-105 hover:shadow-lg cursor-pointer hover:bg-sky-100`}
          title="All installations"
          total={Object.values(parsedData.installations).reduce(
            (acc, v) => acc + v,
            0
          )}
          notifications={null}
          onclick={() => router.push('/user/devices')}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-none text-sky-500 stroke-current stroke-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5"
            />
          </svg>
        </CardDataStats>
        <CardDataStats
          className={`hover:scale-105 hover:shadow-lg cursor-pointer hover:bg-sky-100`}
          title="Cameras"
          total={parsedData.installations.cameras}
          notifications={parsedData.notifications.cameras}
          onclick={() => router.push('/user/devices/cameras')}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-none text-sky-500 stroke-current stroke-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </CardDataStats>

        <CardDataStats
          className={`hover:scale-105 hover:shadow-lg cursor-pointer hover:bg-sky-100`}
          title="Fences"
          total={parsedData.installations.fences}
          notifications={parsedData.notifications.fences}
          onclick={() => router.push('/user/devices/fences')}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-none text-sky-500 stroke-current stroke-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5"
            />
          </svg>
        </CardDataStats>

        <CardDataStats
          className={`hover:scale-105 hover:shadow-lg cursor-pointer hover:bg-sky-100`}
          title="Access Controls"
          total={parsedData.installations.accesscontrols}
          notifications={parsedData.notifications.accessControls}
          onclick={() => router.push('/user/devices/access-controls')}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-none text-sky-500 stroke-current stroke-1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a7.464 7.464 0 0 1-1.15 3.993m1.989 3.559A11.209 11.209 0 0 0 8.25 10.5a3.75 3.75 0 1 1 7.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 0 1-3.6 9.75m6.633-4.596a18.666 18.666 0 0 1-2.485 5.33"
            />
          </svg>
        </CardDataStats>
      </div>
    );
}
