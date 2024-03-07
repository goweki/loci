"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogoSymbol } from "../atoms/svgs";

export default function Header() {
  const [top, setTop] = useState(true);

  // detect whether user has scrolled the page down by 10px
  useEffect(() => {
    const scrollHandler = () => {
      window.scrollY > 10 ? setTop(false) : setTop(true);
    };
    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, [top]);

  return (
    <header
      className={`fixed w-full z-30 md:bg-opacity-90 transition duration-150 ease-in-out ${
        !top && "bg-white/90 backdrop-blur-sm shadow-lg"
      }`}
      id="header"
    >
      <div className="max-w-screen-xl mx-auto px-5 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Site branding */}
          <div className="flex-shrink-0 mr-4">
            {/* Logo */}
            <Link href="/" className="block" aria-label="LOCi">
              {/* <Image
                className="hover:shadow-md"
                src={`/logos/symbol.svg`}
                alt="logo"
                width="32"
                height="32"
              /> */}
              <LogoSymbol classname="w-12 h-12 hover:scale-110 transition-all" />
            </Link>
          </div>
          {/* Site navigation */}
          <nav className="flex flex-grow">
            <ul className="flex flex-grow justify-end flex-wrap items-center">
              <li>
                <Link href="/signIn" className="btn-sec my-0">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/signUp" className="btn flex flex-nowrap my-0">
                  <span>Sign up</span>
                  <svg
                    className="w-3 h-3 fill-current flex-shrink-0 ml-2 -mr-1"
                    viewBox="0 0 12 12"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11.707 5.293L7 .586 5.586 2l3 3H0v2h8.586l-3 3L7 11.414l4.707-4.707a1 1 0 000-1.414z"
                      fillRule="nonzero"
                    />
                  </svg>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
