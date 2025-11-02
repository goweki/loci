"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function HowBlocks() {
  const steps = [
    {
      title: "Sign Up & Verify",
      description:
        "Create your account in minutes and verify your business details to get started",
      icon: (
        <svg
          className="w-16 h-16 p-1 -mt-1 mb-2 text-primary"
          viewBox="0 0 64 64"
        >
          <g fill="none" fillRule="evenodd">
            <rect className="fill-primary/20" width="64" height="64" rx="32" />
            <g strokeWidth="2">
              <circle className="stroke-foreground" cx="32" cy="24" r="6" />
              <path
                className="stroke-foreground"
                d="M20 44c0-6.627 5.373-12 12-12s12 5.373 12 12"
              />
              <path
                className="stroke-primary/70"
                strokeLinecap="round"
                d="M42 22l3 3 5-5"
              />
            </g>
          </g>
        </svg>
      ),
    },
    {
      title: "Add Phone Numbers",
      description:
        "Connect your custom business phone numbers or get new ones instantly",
      icon: (
        <svg
          className="w-16 h-16 p-1 -mt-1 mb-2 text-primary"
          viewBox="0 0 64 64"
        >
          <g fill="none" fillRule="evenodd">
            <rect className="fill-primary/20" width="64" height="64" rx="32" />
            <g strokeWidth="2">
              <rect
                className="stroke-foreground"
                x="22"
                y="18"
                width="20"
                height="28"
                rx="2"
              />
              <path
                className="stroke-primary/70"
                d="M28 22h8M28 26h8M28 30h4"
              />
              <circle className="stroke-primary" cx="32" cy="41" r="2" />
            </g>
          </g>
        </svg>
      ),
    },
    {
      title: "Configure Templates",
      description:
        "Set up message templates for marketing campaigns and customer support",
      icon: (
        <svg
          className="w-16 h-16 p-1 -mt-1 mb-2 text-primary"
          viewBox="0 0 64 64"
        >
          <g fill="none" fillRule="evenodd">
            <rect className="fill-primary/20" width="64" height="64" rx="32" />
            <g strokeWidth="2">
              <rect
                className="stroke-foreground"
                x="20"
                y="22"
                width="24"
                height="20"
                rx="2"
              />
              <path
                className="stroke-primary/70"
                d="M24 28h16M24 32h12M24 36h8"
              />
              <path
                className="stroke-primary"
                strokeLinecap="round"
                d="M38 38l6 4v-8"
              />
            </g>
          </g>
        </svg>
      ),
    },
    {
      title: "Launch Campaigns",
      description:
        "Fire up marketing messages, promotional offers, and automated customer engagement",
      icon: (
        <svg
          className="w-16 h-16 p-1 -mt-1 mb-2 text-primary"
          viewBox="0 0 64 64"
        >
          <g fill="none" fillRule="evenodd">
            <rect className="fill-primary/20" width="64" height="64" rx="32" />
            <g strokeWidth="2">
              <path className="stroke-foreground" d="M20 32l8-4v20l-8-4z" />
              <path
                className="stroke-primary/70"
                d="M28 28c4 2 8 4 12 4s8-2 12-4"
              />
              <path
                className="stroke-primary"
                d="M28 36c4-2 8-4 12-4s8 2 12 4"
              />
              <circle className="stroke-primary" cx="44" cy="24" r="3" />
            </g>
          </g>
        </svg>
      ),
    },
    {
      title: "Automate Support",
      description:
        "Deploy AI-powered chatbots and automated responses for 24/7 customer service",
      icon: (
        <svg
          className="w-16 h-16 p-1 -mt-1 mb-2 text-primary"
          viewBox="0 0 64 64"
        >
          <g fill="none" fillRule="evenodd">
            <rect className="fill-primary/20" width="64" height="64" rx="32" />
            <g strokeWidth="2">
              <circle className="stroke-foreground" cx="32" cy="28" r="8" />
              <path
                className="stroke-primary/70"
                d="M24 36v2a4 4 0 004 4h8a4 4 0 004-4v-2"
              />
              <circle className="stroke-primary" cx="28" cy="27" r="1.5" />
              <circle className="stroke-primary" cx="36" cy="27" r="1.5" />
              <path
                className="stroke-primary"
                strokeLinecap="round"
                d="M28 32c1.5 1 2.5 1 4 0"
              />
            </g>
          </g>
        </svg>
      ),
    },
    {
      title: "Track & Optimize",
      description:
        "Monitor campaign performance with real-time analytics and optimize your messaging strategy",
      icon: (
        <svg
          className="w-16 h-16 p-1 -mt-1 mb-2 text-primary"
          viewBox="0 0 64 64"
        >
          <g fill="none" fillRule="evenodd">
            <rect className="fill-primary/20" width="64" height="64" rx="32" />
            <g strokeWidth="2">
              <path
                className="stroke-foreground"
                d="M22 42V28M28 42V24M34 42V32M40 42V26"
              />
              <path
                className="stroke-primary/70"
                strokeLinecap="round"
                d="M20 22l6-4 6 4 6-4 6 4"
              />
              <circle className="stroke-primary" cx="26" cy="18" r="2" />
            </g>
          </g>
        </svg>
      ),
    },
  ];

  return (
    <section id="howBlocks" className="relative">
      <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
          <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
          <p className="text-muted-foreground mt-2">
            Get your WhatsApp Business integration up and running in minutes.
            Connect with customers, automate support, and grow your business
            effortlessly.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="flex flex-col items-center text-center p-6 hover:shadow-lg transition-shadow duration-300"
            >
              {step.icon}
              <CardHeader>
                <CardTitle className="text-xl font-bold">
                  {step.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {step.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
