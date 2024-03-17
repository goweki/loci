"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { LogoSymbol } from "../atoms/svgs";
import { pascalCase } from "@/helpers/formatters";

// export default function Header() {
//   const [top, setTop] = useState(true);

//   // detect whether user has scrolled the page down by 10px
//   useEffect(() => {
//     const scrollHandler = () => {
//       window.scrollY > 10 ? setTop(false) : setTop(true);
//     };
//     window.addEventListener("scroll", scrollHandler);
//     return () => window.removeEventListener("scroll", scrollHandler);
//   }, [top]);

//   return (
//     <header
//       className={`fixed w-full z-30 md:bg-opacity-90 transition duration-150 ease-in-out ${
//         !top && "bg-white/90 backdrop-blur-sm shadow-lg"
//       }`}
//       id="header"
//     >
//       <div className="max-w-screen-xl mx-auto px-5 sm:px-6">
//         <div className="flex items-center justify-between h-16 md:h-20">
//           {/* Site branding */}
//           <div className="flex-shrink-0 mr-4">
//             {/* Logo */}
//             <Link href="/" className="block" aria-label="LOCi">
//               {/* <Image
//                 className="hover:shadow-md"
//                 src={`/logos/symbol.svg`}
//                 alt="logo"
//                 width="32"
//                 height="32"
//               /> */}
//               <LogoSymbol classname="w-12 h-12 hover:scale-110 transition-all" />
//             </Link>
//           </div>
//           {/* Site navigation */}
//           <nav className="flex flex-grow">
//             <ul className="flex flex-grow justify-end flex-wrap items-center">
//               <li className="my-4">
//                 <Link href="/signIn" className="btn-sec my-0">
//                   Sign in
//                 </Link>
//               </li>
//               <li className="mx-4">
//                 <Link href="/signUp" className="btn flex flex-nowrap my-0">
//                   <span>Sign up</span>
//                   <svg
//                     className="w-3 h-3 fill-current flex-shrink-0 ml-2 -mr-1"
//                     viewBox="0 0 12 12"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       d="M11.707 5.293L7 .586 5.586 2l3 3H0v2h8.586l-3 3L7 11.414l4.707-4.707a1 1 0 000-1.414z"
//                       fillRule="nonzero"
//                     />
//                   </svg>
//                 </Link>
//               </li>
//             </ul>
//           </nav>
//         </div>
//       </div>
//     </header>
//   );
// }

export default function Header({ user }) {
  const pathname = usePathname();
  const [top, setTop] = useState(true);
  const [openItem, setOpenItem] = useState("");

  // detect whether user has scrolled the page down by 10px
  useEffect(() => {
    const scrollHandler = () => {
      window.scrollY > 10 ? setTop(false) : setTop(true);
    };
    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, [top]);

  return (
    <nav
      className={`fixed w-full z-30 md:bg-opacity-90 transition duration-150 ease-in-out shadow ${
        !top && "bg-white/90 backdrop-blur-sm shadow-lg"
      }`}
      id="header"
    >
      <div className="mx-auto max-w-screen-xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* HAMBURGER MENU - Mobile menu button */}
            <button
              type="button"
              className={`${
                openItem === "mobile-menu" ? "bg-sky-700 text-white" : ""
              } relative inline-flex items-center justify-center rounded-md p-2 hover:bg-sky-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500`}
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() =>
                setOpenItem((prev) => {
                  if (prev === "mobile-menu") return "";
                  else return "mobile-menu";
                })
              }
            >
              <span className="absolute -inset-0.5"></span>
              <span className="sr-only">Open main menu</span>
              {/*************************
               * Icon when menu is closed.
               * *************************/}
              <svg
                className={
                  openItem === "mobile-menu" ? "hidden" : "block h-6 w-6"
                }
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
              {/*************************
               * Icon when menu is open.
               * *************************/}
              <svg
                className={
                  openItem === "mobile-menu" ? "block h-6 w-6" : "hidden"
                }
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div>
              <Link
                href="/"
                className="group flex flex-row flex-nowrap items-center"
              >
                <LogoSymbol classname="w-10 h-10 group-hover:scale-110 transition-all" />
                {pathname !== "/" && (
                  <span className="hidden md:inline-block mx-2 font-semibold text-sky-700">
                    LOCi
                  </span>
                )}
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {/**********
                 * MENU ITEMS
                 * ************/}
                {menuItems[user ? "loggedIn" : "loggedOut"].map((v) => (
                  <Link
                    key={v.name}
                    href={v.link}
                    className={`${
                      pathname.includes(v.name) ||
                      (pathname === "/" && v.name === "home") ||
                      (pathname === "/user" && v.name === "home")
                        ? "bg-gray-700 text-white"
                        : ""
                    } hover:bg-sky-700 hover:text-white rounded-md px-3 py-2 font-medium`}
                  >
                    {pascalCase(v.name)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {/********************************
           * USER dropdown button & menu - when logged in
           * *******************************/}
          {user ? (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <button
                type="button"
                className="hidden sm:inline-block relative rounded-full p-2 hover:bg-sky-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all ease-in-out"
              >
                <span className="absolute -inset-1.5"></span>
                <span className="sr-only">View notifications</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
              </button>

              {/**********************
               * USER dropdown pop-up
               * ********************/}
              <div className="relative ml-3">
                <div>
                  <button
                    type="button"
                    className={`btn-sec relative flex text-sm ${
                      openItem === "user-dropdown"
                        ? "bg-gray-800 text-white"
                        : ""
                    }`}
                    id="user-menu-button"
                    aria-haspopup="true"
                    onClick={() =>
                      setOpenItem((prev) => {
                        if (prev === "user-dropdown") return "";
                        else return "user-dropdown";
                      })
                    }
                  >
                    <span className="absolute -inset-1.5"></span>
                    <span className="sr-only">Open user menu</span>
                    {/* <img
                      className="h-8 w-8 rounded-full"
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt=""
                    /> */}
                    <span>{user.name}</span>
                  </button>
                </div>

                {/*
              Dropdown menu, show/hide based on menu state.

              Entering: "transition ease-out duration-100"
              From: "transform opacity-0 scale-95"
              To: "transform opacity-100 scale-100"
              Leaving: "transition ease-in duration-75"
              From: "transform opacity-100 scale-100"
              To: "transform opacity-0 scale-95"
              */}
                <div
                  className={`${
                    openItem === "user-dropdown" ? "" : "hidden"
                  } absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-sky-100 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
                  role="menu"
                  aria-orientation="vertical"
                  // aria-labelledby="user-menu-button"
                  tabindex="-1"
                >
                  <Link
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700"
                    role="menuitem"
                    tabindex="-1"
                    id="user-menu-item-0"
                  >
                    Your Profile
                  </Link>
                  <Link
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700"
                    role="menuitem"
                    tabindex="-1"
                    id="user-menu-item-1"
                  >
                    Settings
                  </Link>
                  <Link
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700"
                    role="menuitem"
                    tabindex="-1"
                    id="user-menu-item-2"
                    onClick={(e) => {
                      e.preventDefault();
                      signOut();
                    }}
                  >
                    Sign Out
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <Link
                href="/signIn"
                className="btn text-sm md:text-base"
                aria-current="page"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE MENU, show/hide based on 'openItem==="mobile-menu"' state. */}
      <div
        className={
          openItem === "mobile-menu"
            ? "sm:hidden bg-sky-100/80 backdrop-blur-sm"
            : "hidden"
        }
        id="mobile-menu"
      >
        <div className="space-y-1 px-2 pb-3 pt-2">
          {menuItems[user ? "loggedIn" : "loggedOut"].map((v) => (
            <Link
              key={v.name}
              href={v.link}
              onClick={(e) => {
                setOpenItem("");
                if (v.name === "sign-in") {
                  signIn();
                } else if (v.name === "sign-out") {
                  signOut();
                }
              }}
              className={`${
                pathname.includes(v.name) ||
                (pathname === "/" && v.name === "home") ||
                (pathname === "/user" && v.name === "home")
                  ? "bg-gray-800 text-white"
                  : ""
              } block hover:bg-sky-700 hover:text-white rounded-md px-3 py-2 font-medium`}
            >
              {pascalCase(v.name)}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

const menuItems = {
  loggedOut: [
    { name: "home", link: "/" },
    { name: "blog", link: "/blog" },
    { name: "contacts", link: "/contacts" },
    { name: "sign-in", link: "#" },
  ],
  loggedIn: [
    { name: "home", link: "/user" },
    { name: "blog", link: "/blog" },
  ],
};
