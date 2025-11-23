"use client";
import { useState, useRef, useEffect } from "react";

interface TransitionProps {
  show: boolean;
  appear?: boolean;
  className?: string;
  enter?: string;
  enterStart?: string;
  enterEnd?: string;
  leave?: string;
  leaveStart?: string;
  leaveEnd?: string;
  children: React.ReactNode;
}
// Transition Component
function Transition(props: TransitionProps) {
  const {
    show,
    appear,
    className,
    enter,
    enterStart,
    enterEnd,
    leave,
    leaveStart,
    leaveEnd,
    children,
  } = props;
  const [render, setRender] = useState(show);
  const [stage, setStage] = useState(show ? "enterEnd" : "leaveEnd");

  useEffect(() => {
    if (show) {
      setRender(true);
      setTimeout(() => setStage("enterStart"), 10);
      setTimeout(() => setStage("enterEnd"), 20);
    } else if (render) {
      setStage("leaveStart");
      setTimeout(() => setStage("leaveEnd"), 300);
      setTimeout(() => setRender(false), 320);
    }
  }, [show, render]);

  if (!render) return null;

  const getClasses = () => {
    const classes = [className];
    if (stage === "enterStart") classes.push(enter, enterStart);
    if (stage === "enterEnd") classes.push(enter, enterEnd);
    if (stage === "leaveStart") classes.push(leave, leaveStart);
    if (stage === "leaveEnd") classes.push(leave, leaveEnd);
    return classes.filter(Boolean).join(" ");
  };

  return <div className={getClasses()}>{children}</div>;
}

export default function Features() {
  const [tab, setTab] = useState(1);
  const tabs = useRef<HTMLDivElement | null>(null);

  const heightFix = () => {
    if (
      tabs.current &&
      tabs.current.children &&
      tabs.current.children[tab - 1]
    ) {
      const child = tabs.current.children[tab - 1] as HTMLElement;
      tabs.current.style.height = child.offsetHeight + "px";
    }
  };

  useEffect(() => {
    heightFix();
  }, [tab]);

  const tabData = [
    {
      id: 1,
      title: "Integrates with leading security hardware vendors",
      description:
        "If the hardware meets industry standards, LOCi definitely can integrate into it and handle data management and visualization",
      image: "/images/security-landscape.jpeg",
      icon: (
        <svg
          className="w-3 h-3 fill-current"
          viewBox="0 0 12 12"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M11.953 4.29a.5.5 0 00-.454-.292H6.14L6.984.62A.5.5 0 006.12.173l-6 7a.5.5 0 00.379.825h5.359l-.844 3.38a.5.5 0 00.864.445l6-7a.5.5 0 00.075-.534z" />
        </svg>
      ),
    },
    {
      id: 2,
      title:
        "Consolidates different security installations into a single portal",
      description:
        "Put aside the different interfaces and dashboards and let LOCi unify all installations via a single portal",
      image: "/images/security-data-unification.jpeg",
      icon: (
        <svg
          className="w-3 h-3 fill-current"
          viewBox="0 0 12 12"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.854.146a.5.5 0 00-.525-.116l-11 4a.5.5 0 00-.015.934l4.8 1.921 1.921 4.8A.5.5 0 007.5 12h.008a.5.5 0 00.462-.329l4-11a.5.5 0 00-.116-.525z"
            fillRule="nonzero"
          />
        </svg>
      ),
    },
    {
      id: 3,
      title: "Automated alerts and streamlined security operations",
      description:
        "From in-browser notifications to SMS and email alerts, LOCi gives you visibility of your security installations to keep you informed",
      image: "/images/security-alerts.jpeg",
      icon: (
        <svg
          className="w-3 h-3 fill-current"
          viewBox="0 0 12 12"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11.334 8.06a.5.5 0 00-.421-.237 6.023 6.023 0 01-5.905-6c0-.41.042-.82.125-1.221a.5.5 0 00-.614-.586 6 6 0 106.832 8.529.5.5 0 00-.017-.485z"
            fillRule="nonzero"
          />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative" id="features">
      {/* Section background */}
      <div
        className="absolute inset-0 bg-card pointer-events-none mb-16"
        aria-hidden="true"
      ></div>
      <div className="absolute left-0 right-0 m-auto w-px p-px h-20 bg-card transform -translate-y-1/2"></div>

      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6">
        <div className="pt-12 md:pt-20">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center pb-12 md:pb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Explore the product features
            </h2>
            <h3 className="text-lg md:text-xl text-muted-foreground">
              A robust security portal that integrates with the common security
              hardware to organize your security operations and manage data
            </h3>
          </div>

          {/* Section content */}
          <div className="md:grid md:grid-cols-12 md:gap-6">
            {/* Content */}
            <div
              className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-7 lg:col-span-6 md:mt-6"
              data-aos="fade-right"
            >
              {/* Tabs buttons */}
              <div
                className="mb-8 md:mb-0"
                role="tablist"
                aria-label="Product features"
              >
                {tabData.map((item) => (
                  <button
                    key={item.id}
                    className={`w-full flex items-center text-lg p-5 rounded border transition duration-300 ease-in-out mb-3 ${
                      tab !== item.id
                        ? "bg-card shadow-md border-border hover:shadow-lg hover:bg-accent"
                        : "bg-muted border-transparent"
                    }`}
                    role="tab"
                    aria-selected={tab === item.id}
                    aria-controls={`tabpanel-${item.id}`}
                    onClick={() => setTab(item.id)}
                  >
                    <div className="text-left">
                      <div className="font-bold leading-snug tracking-tight mb-1 text-foreground">
                        {item.title}
                      </div>
                      <div className="text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                    <div className="flex justify-center items-center w-8 h-8 bg-background rounded-full shadow flex-shrink-0 ml-3">
                      {item.icon}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tabs items */}
            <div
              className="max-w-xl md:max-w-none md:w-full mx-auto md:col-span-5 lg:col-span-6 md:mt-8 md:order-1"
              data-aos="zoom-y-out"
              ref={tabs}
            >
              <div className="relative flex flex-col text-center lg:text-right">
                {tabData.map((item) => (
                  <Transition
                    key={item.id}
                    show={tab === item.id}
                    appear={true}
                    className="w-full"
                    enter="transition ease-in-out duration-700 transform order-first"
                    enterStart="opacity-0 translate-y-16"
                    enterEnd="opacity-100 translate-y-0"
                    leave="transition ease-in-out duration-300 transform absolute"
                    leaveStart="opacity-100 translate-y-0"
                    leaveEnd="opacity-0 -translate-y-16"
                  >
                    <div
                      className="relative inline-flex flex-col"
                      role="tabpanel"
                      id={`tabpanel-${item.id}`}
                      aria-labelledby={`tab-${item.id}`}
                    >
                      <img
                        className="md:max-w-none mx-auto rounded"
                        src={item.image}
                        width="500"
                        height="462"
                        alt={item.title}
                      />
                    </div>
                  </Transition>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
