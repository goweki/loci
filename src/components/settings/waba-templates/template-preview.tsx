// app/dashboard/templates/template-preview.tsx
"use client";

import { useEffect } from "react";
import type { WabaTemplate } from "@/lib/prisma/generated";

interface TemplatePreviewProps {
  template: WabaTemplate;
  onClose: () => void;
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

export function TemplatePreview({ template, onClose }: TemplatePreviewProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  const components = (template.components as unknown as ComponentType[]) || [];
  const headerComponent = components.find((c) => c.type === "HEADER");
  const bodyComponent = components.find((c) => c.type === "BODY");
  const footerComponent = components.find((c) => c.type === "FOOTER");
  const buttonsComponent = components.find((c) => c.type === "BUTTONS");

  const replaceVariables = (text: string | undefined): string => {
    if (!text) return "";
    return text.replace(/\{\{(\d+)\}\}/g, (_, num) => `[Var ${num}]`);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-title"
    >
      <div
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 id="preview-title" className="text-xl font-semibold">
            Template Preview
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close preview"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* WhatsApp-style Preview */}
        <div className="p-6">
          <div className="bg-gradient-to-b from-primary to-secondary p-4 rounded-t-lg">
            <p className="text-xs mb-2">Preview as WhatsApp message</p>
          </div>

          <div className="bg-white border-x border-b rounded-b-lg shadow-sm">
            {/* Message Bubble */}
            <div className="p-4 space-y-3">
              <div className="bg-green-50 rounded-lg p-3 shadow-sm max-w-[85%]">
                {/* Header */}
                {headerComponent && (
                  <div className="mb-2">
                    {headerComponent.format === "IMAGE" && (
                      <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    {headerComponent.format === "VIDEO" && (
                      <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    )}
                    {headerComponent.format === "DOCUMENT" && (
                      <div className="w-full p-3 bg-gray-100 rounded mb-2 flex items-center gap-2">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="text-sm text-gray-600">Document</span>
                      </div>
                    )}
                    {headerComponent.format === "TEXT" &&
                      headerComponent.text && (
                        <div className="font-semibold text-gray-900 mb-1">
                          {replaceVariables(headerComponent.text)}
                        </div>
                      )}
                  </div>
                )}

                {/* Body */}
                {bodyComponent && bodyComponent.text && (
                  <div className="text-gray-800 text-sm whitespace-pre-wrap">
                    {replaceVariables(bodyComponent.text)}
                  </div>
                )}

                {/* Footer */}
                {footerComponent && footerComponent.text && (
                  <div className="text-xs text-gray-500 mt-2 italic">
                    {footerComponent.text}
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-2 text-right">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {/* Buttons */}
              {buttonsComponent &&
                buttonsComponent.buttons &&
                buttonsComponent.buttons.length > 0 && (
                  <div className="space-y-2">
                    {buttonsComponent.buttons.map((button, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="w-full max-w-[85%] py-2 px-4 bg-white border border-gray-300 rounded-lg text-blue-600 text-sm font-medium hover:bg-gray-50 transition-colors text-left"
                      >
                        {button.type === "URL" && "🔗 "}
                        {button.type === "PHONE_NUMBER" && "📞 "}
                        {replaceVariables(button.text)}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Template Info */}
        <div className="px-6 pb-6 space-y-3">
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Template Information</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Name:</dt>
                <dd className="font-medium">{template.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Category:</dt>
                <dd className="font-medium">{template.category}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Language:</dt>
                <dd className="font-medium">{template.language}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Status:</dt>
                <dd className="font-medium">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      template.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : template.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : template.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {template.status}
                  </span>
                </dd>
              </div>
              {template.rejectedReason && (
                <div className="pt-2">
                  <dt className="text-gray-600 mb-1">Rejection Reason:</dt>
                  <dd className="text-red-700 text-xs bg-red-50 p-2 rounded">
                    {template.rejectedReason}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
