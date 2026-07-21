"use client";

import * as React from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name?: string;
  defaultPreview?: string;
  maxSizeMB?: number;
  onFileSelect?: (file: File | null) => void;
}

export const ImageInput = React.forwardRef<HTMLInputElement, ImageInputProps>(
  (
    {
      name = "image",
      defaultPreview,
      maxSizeMB = 5,
      onFileSelect,
      className,
      disabled,
      accept = "image/*",
      ...props
    },
    ref,
  ) => {
    // Internal ref to access the file input DOM node if no outer ref is passed
    const internalRef = React.useRef<HTMLInputElement>(null);
    const inputRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    // React state only tracks the string URL for previewing, NOT the File object
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(
      defaultPreview || null,
    );
    const [error, setError] = React.useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      setError(null);

      if (!file) {
        onFileSelect?.(null);
        return;
      }

      // Optional file size check
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File size exceeds ${maxSizeMB}MB limit.`);
        if (inputRef.current) inputRef.current.value = "";
        onFileSelect?.(null);
        return;
      }

      // Generate a lightweight blob URL string for rendering the image preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      onFileSelect?.(file);
    };

    const handleRemove = () => {
      // Clear the native DOM input value
      if (inputRef.current) {
        inputRef.current.value = "";
      }

      // Clean up object URL memory if we generated one
      if (previewUrl && previewUrl !== defaultPreview) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(null);
      setError(null);
      onFileSelect?.(null);
    };

    // Drag and drop event handlers
    const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0 && inputRef.current) {
        // Assign dropped file list directly to the native input element
        inputRef.current.files = droppedFiles;

        // Trigger change event manually to update preview
        const event = new Event("change", { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    };

    return (
      <div className={cn("w-full max-w-sm space-y-2", className)}>
        {/* Native File Input — Owns the actual File binary for FormData / Server Actions */}
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          id={`image-input-${name}`}
          {...props}
        />

        {previewUrl ? (
          <div className="relative rounded-lg border bg-muted/30 p-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-background">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            </div>

            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          </div>
        ) : (
          <label
            htmlFor={`image-input-${name}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-accent hover:border-accent-foreground/50 transition-colors cursor-pointer",
              disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
            )}
          >
            <div className="rounded-full bg-secondary p-3 text-secondary-foreground mb-2">
              <ImagePlus className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">Click or drop an image here</p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, or WEBP up to {maxSizeMB}MB
            </p>
          </label>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);

ImageInput.displayName = "ImageInput";
