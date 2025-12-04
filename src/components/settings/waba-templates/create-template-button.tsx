// app/dashboard/templates/create-template-button.tsx

"use client";

import { Button } from "@/components/ui/button";

export function CreateTemplateButton() {
  const handleCreate = () => {
    // TODO: Implement create template modal or navigate to create page
    console.log("Create template clicked");
  };

  return (
    <Button onClick={handleCreate}>
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      Create Template
    </Button>
  );
}
