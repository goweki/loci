"use client";
import { useState } from "react";
import Modal from "../../mols/modal";
import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  // const [videoModalOpen, setVideoModalOpen] = useState(false);

  return (
    <section className="relative" id="hero">
      {/* Illustration behind hero content */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 bottom-0 pointer-events-none"
        aria-hidden="true"
      >
        <svg
          width="1360"
          height="578"
          viewBox="0 0 1360 578"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              x1="50%"
              y1="0%"
              x2="50%"
              y2="100%"
              id="illustration-01"
            >
              <stop stopColor="#FFF" offset="0%" />
              <stop stopColor="#EAEAEA" offset="77.402%" />
              <stop stopColor="#DFDFDF" offset="100%" />
            </linearGradient>
          </defs>
          <g fill="url(#illustration-01)" fillRule="evenodd">
            <circle cx="1232" cy="128" r="128" />
            <circle cx="155" cy="443" r="64" />
          </g>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero content */}
        <div className="pb-8 pt-8 md:pt-20 md:pb-20">
          {/* Section header */}
          <div className="text-center pb-12 md:pb-16">
            <div
              className="leading-tighter tracking-tighter"
              data-aos="zoom-y-out"
            >
              <h1 className="mb-6">
                <span className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-teal-400">
                  LOCi
                </span>
              </h1>
              <h2
                className="text-5xl md:text-6xl font-normal mb-2"
                data-aos="zoom-y-out"
              >
                the security portal
              </h2>
            </div>
            <div className="max-w-3xl mx-auto">
              <h3 data-aos="zoom-y-out" data-aos-delay="150">
                Unifying your security installations so you get all the
                notifications and analytics at your fingertip
              </h3>
              <div
                className="max-w-xs mx-auto sm:max-w-none sm:flex sm:justify-center"
                data-aos="zoom-y-out"
                data-aos-delay="300"
              >
                <div className="m-4">
                  <Link className="btn-sec" href="#features">
                    Learn more
                  </Link>
                </div>
                <div className="m-4">
                  <Link className="btn" href="/signIn">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div>
            <div
              className="relative flex justify-center mb-8"
              data-aos="zoom-y-out"
              data-aos-delay="450"
            >
              <div className="flex flex-col justify-center">
                <Image
                  className="mx-auto"
                  src="/images/illustration-B.jpg"
                  width="768"
                  height="432"
                  alt="Hero image"
                />
              </div>
              {/* <button
                className="absolute top-full flex items-center transform -translate-y-1/2 bg-white rounded-full font-medium group p-4 shadow-lg"
                onClick={(e) => {
                  e.preventDefault();
                  setVideoModalOpen(true);
                }}
                aria-controls="modal"
              >
                <svg
                  className="w-6 h-6 fill-current text-gray-400 group-hover:text-sky-600 flex-shrink-0"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zm0 2C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12z" />
                  <path d="M10 17l6-5-6-5z" />
                </svg>
                <span className="ml-3">Watch the full video (2 min)</span>
              </button> */}
            </div>
            {/* <Modal
              id="modal"
              ariaLabel="modal-headline"
              show={videoModalOpen}
              handleClose={() => setVideoModalOpen(false)}
            >
              <div className="relative pb-9/16">
                <iframe
                  className="absolute w-full h-full"
                  src="movie.ogg"
                  title="Video"
                  allowFullScreen
                ></iframe>
              </div>
            </Modal> */}
          </div>
        </div>
      </div>
    </section>
  );
}
