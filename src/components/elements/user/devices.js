"use client";
import { DataContext } from "@/app/user/providers";
import { useContext, useEffect, useState } from "react";

export function Devices() {
    const [tab, setTab] = useState("");
    const [devices, setDevices] = useState("");
    const { data, refreshData } = useContext(DataContext)
    //set devices
    useEffect(() => {
        let deviceArr = {};

        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            //loop through devices
            element.devices.forEach(device => {
                // Extract the device type
                const { deviceID, deviceSN, deviceType } = device;

                // If the device type already exists in the count object, increment its count
                // Otherwise, initialize its count to 1
                if (deviceArr[deviceType]) {
                    deviceArr[deviceType].push({ deviceID, deviceType, deviceSN })
                } else {
                    deviceArr[deviceType] = [{ deviceID, deviceType, deviceSN }];
                }
            });
        }
        setDevices(deviceArr)
    }, [data])
    //render
    if (devices) return (
        <div className="md:flex">
            <ul className="flex-column space-y space-y-4 text-sm font-medium text-gray-500  md:me-4 mb-4 md:mb-0">
                <li>
                    <button
                        className={`inline-flex items-center px-4 py-3 rounded-lg w-full ${!tab ? 'text-white bg-sky-700 active' : 'hover:text-gray-900 bg-gray-50 hover:bg-gray-100'} `}
                        aria-current="page"
                        onClick={() => setTab('')}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            className="w-5 h-5 me-2 fill-current"
                        >
                            <path d="M18.75 12.75h1.5a.75.75 0 0 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5ZM12 6a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 6ZM12 18a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 12 18ZM3.75 6.75h1.5a.75.75 0 1 0 0-1.5h-1.5a.75.75 0 0 0 0 1.5ZM5.25 18.75h-1.5a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 0 1.5ZM3 12a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 3 12ZM9 3.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM12.75 12a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0ZM9 15.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
                        </svg>
                        All
                    </button>
                </li>
                <li>
                    <button
                        className={`inline-flex items-center px-4 py-3 rounded-lg w-full ${tab === 'cameras' ? 'text-white bg-sky-700 active' : 'hover:text-gray-900 bg-gray-50 hover:bg-gray-100'} `}
                        onClick={() => setTab('cameras')}
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current me-2">
                            <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
                        </svg>
                        Cameras
                    </button>
                </li>
                <li>
                    <button
                        className={`inline-flex items-center px-4 py-3 rounded-lg w-full ${tab === 'fences' ? 'text-white bg-sky-700 active' : 'hover:text-gray-900 bg-gray-50 hover:bg-gray-100'} `}
                        onClick={() => setTab('fences')}
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current me-2">
                            <path
                                fillRule="evenodd"
                                d="M1.5 5.625c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v12.75c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 18.375V5.625ZM21 9.375A.375.375 0 0 0 20.625 9h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375-.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375-.375v-1.5Zm0 3.75a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5a.375.375 0 0 0 .375-.375v-1.5ZM10.875 18.75a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375h7.5ZM3.375 15h7.5a.375.375 0 0 0 .375-.375v-1.5a.375.375 0 0 0-.375-.375h-7.5a.375.375 0 0 0-.375.375v1.5c0 .207.168.375.375.375Zm0-3.75h7.5a.375.375 0 0 0 .375-.375v-1.5A.375.375 0 0 0 10.875 9h-7.5A.375.375 0 0 0 3 9.375v1.5c0 .207.168.375.375.375Z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Fences
                    </button>
                </li>
                <li>
                    <button

                        className={`inline-flex items-center px-4 py-3 rounded-lg w-full ${tab === 'access-controls' ? 'text-white bg-sky-700 active' : 'hover:text-gray-900 bg-gray-50 hover:bg-gray-100'} `}
                        onClick={() => setTab('access-controls')}
                    >
                        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current me-2">
                            <path
                                fillRule="evenodd"
                                d="M12 3.75a6.715 6.715 0 0 0-3.722 1.118.75.75 0 1 1-.828-1.25 8.25 8.25 0 0 1 12.8 6.883c0 3.014-.574 5.897-1.62 8.543a.75.75 0 0 1-1.395-.551A21.69 21.69 0 0 0 18.75 10.5 6.75 6.75 0 0 0 12 3.75ZM6.157 5.739a.75.75 0 0 1 .21 1.04A6.715 6.715 0 0 0 5.25 10.5c0 1.613-.463 3.12-1.265 4.393a.75.75 0 0 1-1.27-.8A6.715 6.715 0 0 0 3.75 10.5c0-1.68.503-3.246 1.367-4.55a.75.75 0 0 1 1.04-.211ZM12 7.5a3 3 0 0 0-3 3c0 3.1-1.176 5.927-3.105 8.056a.75.75 0 1 1-1.112-1.008A10.459 10.459 0 0 0 7.5 10.5a4.5 4.5 0 1 1 9 0c0 .547-.022 1.09-.067 1.626a.75.75 0 0 1-1.495-.123c.041-.495.062-.996.062-1.503a3 3 0 0 0-3-3Zm0 2.25a.75.75 0 0 1 .75.75c0 3.908-1.424 7.485-3.781 10.238a.75.75 0 0 1-1.14-.975A14.19 14.19 0 0 0 11.25 10.5a.75.75 0 0 1 .75-.75Zm3.239 5.183a.75.75 0 0 1 .515.927 19.417 19.417 0 0 1-2.585 5.544.75.75 0 0 1-1.243-.84 17.915 17.915 0 0 0 2.386-5.116.75.75 0 0 1 .927-.515Z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Access Controls
                    </button>
                </li>
                {/* <li>
                    <a className="inline-flex items-center px-4 py-3 text-gray-400 rounded-lg cursor-not-allowed bg-gray-50 w-full">
                        <svg
                            className="w-4 h-4 me-2 text-gray-400 "
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
                        </svg>
                        Disabled
                    </a>
                </li> */}
            </ul>
            <Details selectedTab={tab} devices={devices} />
        </div>
    );
}

function Details({ selectedTab, devices }) {
    if (selectedTab === "cameras")
        return (
            <div className="p-6 bg-gray-50 text-medium text-gray-500 rounded-lg w-full">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Cameras</h3>
                <p className="mb-2">
                    This is some placeholder content the Profile tab&apos;s associated content,
                    clicking another tab will toggle the visibility of this one for the
                    next.
                </p>
                <p>
                    The tab JavaScript swaps classes to control the content visibility and
                    styling.
                </p>
            </div>
        );
    else if (selectedTab === "fences")
        return (
            <div className="p-6 bg-gray-50 text-medium text-gray-500 rounded-lg w-full">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Fences</h3>
                <p className="mb-2">
                    This is some placeholder content the Profile tab&apos;s associated content,
                    clicking another tab will toggle the visibility of this one for the
                    next.
                </p>
                <p>
                    The tab JavaScript swaps classes to control the content visibility and
                    styling.
                </p>
            </div>
        );
    else if (selectedTab === "access-controls")
        return (
            <div className="p-6 bg-gray-50 text-medium text-gray-500 rounded-lg w-full">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Access Controls
                </h3>
                <p className="mb-2">
                    This is some placeholder content the Profile tab&apos;s associated content,
                    clicking another tab will toggle the visibility of this one for the
                    next.
                </p>
                <p>
                    The tab JavaScript swaps classes to control the content visibility and
                    styling.
                </p>
            </div>
        );
    else return (
        <div className="p-6 bg-gray-50 text-medium text-gray-500 rounded-lg w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">All devices</h3>

            <div className="relative overflow-x-auto sm:rounded-lg">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                DeviceID
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Type
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Serial No.
                            </th>
                            <th scope="col" className="px-6 py-3">
                                IP Address
                            </th>
                            {/* <th scope="col" className="px-6 py-3">
                                <span className="sr-only">Edit</span>
                            </th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {Object.values(devices).flat().map((v, i) => <tr key={v.deviceID} className="border-b hover:bg-gray-200 cursor-pointer">
                            <th scope="row" className="px-6 py-4 font-medium  whitespace-nowrap">
                                {v.deviceID}
                            </th>
                            <td className="px-6 py-4">
                                {v.deviceType}
                            </td>
                            <td className="px-6 py-4">
                                {v.deviceSN}
                            </td>
                            <td className="px-6 py-4">
                                IP
                            </td>
                            {/* <td className="px-6 py-4 text-right">
                                <a href="#" className="font-medium text-blue-600 hover:underline">Edit</a>
                            </td> */}
                        </tr>)}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
