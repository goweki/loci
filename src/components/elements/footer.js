"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoSymbol } from "../atoms/svgs";
import { InputField } from "../atoms/inputs";

export default function Footer() {
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  return (
    <footer className="border-gray-200 border-y-2 bg-slate-100" id="footer">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top area: Blocks */}
        {!pathname.includes("/user") && (
          <div className="grid sm:grid-cols-6 gap-8 py-8 md:py-12">
            {/* 1st block */}
            <div className="sm:col-span-6">
              <div className="mb-2">
                {/* Logo */}
                <Link
                  href="/"
                  className="group inline-flex items-center border-b pb-3 border-slate-200"
                >
                  <LogoSymbol classname="w-10 h-10 group-hover:scale-110 transition-all" />

                  <span className="md:inline-block mx-2 font-semibold text-sky-700">
                    LOCi
                  </span>
                </Link>
              </div>
            </div>

            {/* Quick links block */}
            <div className="sm:col-span-6 md:col-span-3 ">
              <h6 className="text-gray-800 font-medium mb-2">Quick links</h6>
              <ul className="text-sm">
                <li className="mb-2">
                  <Link
                    href="/"
                    className="text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out"
                  >
                    Home
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    href="/blog"
                    className="text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out"
                  >
                    Blog
                  </Link>
                </li>
                <li className="mb-2">
                  <Link
                    href="/contacts"
                    className="text-gray-600 hover:text-gray-900 transition duration-150 ease-in-out"
                  >
                    Contacts
                  </Link>
                </li>
              </ul>
            </div>

            {/* Request demo block */}
            <div className="sm:col-span-6 md:col-span-3">
              <h6 className="text-gray-800 font-medium mb-2">Request Demo</h6>
              <p className="text-sm text-gray-600 mb-4">
                Leave us with your email and we will be in touch within a week
                to set up a demo
              </p>
              <form>
                <div className="grid grid-cols-4 space-x-2 ">
                  <div className="col-span-3">
                    <InputField
                      name="email"
                      onChange={(e) => {
                        setEmail(e.target.value);
                      }}
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      className="rounded-lg w-full h-full bg-sky-600 disabled:opacity-25 enabled:hover:bg-sky-700"
                      disabled={!!email}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-6 h-6 m-auto text-white"
                      >
                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bottom area */}
        <div className="md:flex md:items-center md:justify-between py-4 md:py-8 border-t border-gray-200">
          {/* Social links */}
          <ul className="flex mb-4 md:order-1 md:ml-4 md:mb-0">
            <li>
              <Link
                href="https://www.twitter.com/goweki_"
                className="flex justify-center items-center text-gray-600 hover:text-gray-900 bg-white hover:bg-white-100 rounded-full shadow transition duration-150 ease-in-out"
                aria-label="Twitter"
              >
                <svg
                  className="w-8 h-8 fill-current"
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M24 11.5c-.6.3-1.2.4-1.9.5.7-.4 1.2-1 1.4-1.8-.6.4-1.3.6-2.1.8-.6-.6-1.5-1-2.4-1-1.7 0-3.2 1.5-3.2 3.3 0 .3 0 .5.1.7-2.7-.1-5.2-1.4-6.8-3.4-.3.5-.4 1-.4 1.7 0 1.1.6 2.1 1.5 2.7-.5 0-1-.2-1.5-.4 0 1.6 1.1 2.9 2.6 3.2-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.3 3.1 2.3-1.1.9-2.5 1.4-4.1 1.4H8c1.5.9 3.2 1.5 5 1.5 6 0 9.3-5 9.3-9.3v-.4c.7-.5 1.3-1.1 1.7-1.8z" />
                </svg>
              </Link>
            </li>
            <li className="ml-4">
              <Link
                href="https://www.github.com/goweki"
                className="flex justify-center items-center text-gray-600 hover:text-gray-900 bg-white hover:bg-white-100 rounded-full shadow transition duration-150 ease-in-out"
                aria-label="Github"
              >
                <svg
                  className="w-8 h-8 fill-current"
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M16 8.2c-4.4 0-8 3.6-8 8 0 3.5 2.3 6.5 5.5 7.6.4.1.5-.2.5-.4V22c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8.6-.2 1.3-.3 2-.3s1.4.1 2 .3c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.7-3.7 3.9.3.4.6.9.6 1.6v2.2c0 .2.1.5.6.4 3.2-1.1 5.5-4.1 5.5-7.6-.1-4.4-3.7-8-8.1-8z" />
                </svg>
              </Link>
            </li>
            <li className="ml-4">
              <Link
                href="https://www.facebook.com/goweki"
                className="flex justify-center items-center text-gray-600 hover:text-gray-900 bg-white hover:bg-white-100 rounded-full shadow transition duration-150 ease-in-out"
                aria-label="Facebook"
              >
                <svg
                  className="w-8 h-8 fill-current"
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M14.023 24L14 17h-3v-3h3v-2c0-2.7 1.672-4 4.08-4 1.153 0 2.144.086 2.433.124v2.821h-1.67c-1.31 0-1.563.623-1.563 1.536V14H21l-1 3h-2.72v7h-3.257z" />
                </svg>
              </Link>
            </li>
          </ul>

          {/* Copyrights note */}
          <div className="text-sm text-gray-600 mr-4">
            Powered by{" "}
            <Link
              className="text-sky-600 hover:underline"
              href="https://goweki.com/"
            >
              GOWEKI
            </Link>
            . All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
