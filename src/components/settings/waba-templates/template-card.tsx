// components/dashboard/templates/template-card.tsx
"use client";

import { useState } from "react";
import type { WabaTemplate } from "@/lib/prisma/generated";
import { TemplatePreview } from "./template-preview";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TemplateCardProps {
  template: WabaTemplate;
}

type ComponentType = {
  type: string;
  format?: string;
  text?: string;
  buttons?: Array<{
    type: string;
    text: string;
    url?: string;
    phone_number?: string;
  }>;
};

export function TemplateCard({ template }: TemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const statusColors: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-800",
    PENDING: "bg-yellow-100 text-yellow-800",
    REJECTED: "bg-red-100 text-red-800",
    DISABLED: "bg-gray-100 text-gray-800",
  };

  const categoryColors: Record<string, string> = {
    MARKETING: "bg-purple-100 text-purple-800",
    UTILITY: "bg-blue-100 text-blue-800",
    AUTHENTICATION: "bg-indigo-100 text-indigo-800",
  };

  const components = (template.components as unknown as ComponentType[]) || [];
  const bodyComponent = components.find((c) => c.type === "BODY");
  const headerComponent = components.find((c) => c.type === "HEADER");
  const footerComponent = components.find((c) => c.type === "FOOTER");
  const buttonsComponent = components.find((c) => c.type === "BUTTONS");

  const countVariables = (text: string | undefined): number => {
    if (!text) return 0;
    return (text.match(/\{\{\d+\}\}/g) || []).length;
  };

  const totalVariables =
    countVariables(headerComponent?.text) + countVariables(bodyComponent?.text);

  return (
    <>
      <Card>
        {/* HEADER */}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <CardTitle className="text-xl">{template.name}</CardTitle>

                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    statusColors[template.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {template.status}
                </span>

                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    categoryColors[template.category] ||
                    "bg-gray-100 text-gray-800"
                  }`}
                >
                  {template.category}
                </span>
              </div>

              <CardDescription>
                Language: {template.language} • Updated:{" "}
                {new Date(template.updatedAt).toLocaleDateString()}
              </CardDescription>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
                title="Preview template"
              >
                Preview
              </Button>

              <Button variant="outline" size="sm" title="Edit template">
                Edit
              </Button>

              <Button variant="destructive" size="sm" title="Delete template">
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* MAIN CONTENT */}
        <CardContent>
          <div className="bg-primary/10 text-popover-foreground rounded-lg border-1 p-4 space-y-2">
            {headerComponent?.text && (
              <div className="font-medium">{headerComponent.text}</div>
            )}

            {headerComponent?.format && headerComponent.format !== "TEXT" && (
              <div className="text-xs text-muted-foreground italic">
                [{headerComponent.format} header]
              </div>
            )}

            {bodyComponent?.text && (
              <div className="text-sm whitespace-pre-wrap">
                {bodyComponent.text}
              </div>
            )}

            {footerComponent?.text && (
              <div className="text-xs text-muted-foreground italic mt-2">
                {footerComponent.text}
              </div>
            )}

            {buttonsComponent?.buttons?.length &&
              buttonsComponent?.buttons?.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {buttonsComponent.buttons.map((button, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 text-xs bg-white border rounded-lg text-blue-600"
                    >
                      {button.type === "URL" && "🔗 "}
                      {button.type === "PHONE_NUMBER" && "📞 "}
                      {button.text}
                    </div>
                  ))}
                </div>
              )}
          </div>

          {/* REJECTED REASON */}
          {template.status === "REJECTED" && template.rejectedReason && (
            <div className="mt-4 p-3 border border-destructive rounded-lg">
              <p className="text-sm font-medium mb-1 text-destructive">
                Rejection Reason:
              </p>
              <p className="text-sm">{template.rejectedReason}</p>
            </div>
          )}

          {/* VARIABLES INFO */}
          {totalVariables > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm opacity-80">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Contains {totalVariables} variable
                {totalVariables !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {showPreview && (
        <TemplatePreview
          template={template}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
