// components/templates/template-form.tsx
"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type {
  WabaTemplate,
  TemplateCategory,
  TemplateLanguage,
} from "@/lib/prisma/generated";
import { useSession } from "next-auth/react";
import {
  WabaTemplateComponent,
  WabaTemplateComponentButtonType,
  WabaTemplateComponentFormat,
  WabaTemplateComponentType,
} from "@/lib/whatsapp/types";

// Zod schema for form validation
const templateFormSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(512, "Template name must be less than 512 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Template name must contain only lowercase letters, numbers, and underscores"
    ),
  category: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
  language: z.enum(["en_US"]),
  components: z.array(z.any()).min(1, "At least one component is required"),
});

type TemplateFormValues = z.infer<typeof templateFormSchema>;

export interface TemplateFormProps {
  template?: WabaTemplate;
  onCancel?: () => void;
}

export function TemplateForm({ template, onCancel }: TemplateFormProps) {
  const [components, setComponents] = useState<WabaTemplateComponent[]>(
    template?.components
      ? (template.components as any as WabaTemplateComponent[])
      : [{ type: "HEADER", text: "" }]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session } = useSession();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template?.name || "",
      category: template?.category || "UTILITY",
      language: template?.language || "en_US",
      components: components,
    },
  });

  if (!session?.user) return;

  const handleSubmit = async (data: TemplateFormValues) => {
    setIsSubmitting(true);
    try {
      // submit logic
      // await createWabaTemplate(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addComponent = (type: WabaTemplateComponentType) => {
    const newComponent: WabaTemplateComponent = { type };

    if (type === "HEADER") {
      newComponent.format = "TEXT";
      newComponent.text = "";
    } else if (type === "BODY" || type === "FOOTER") {
      newComponent.text = "";
    } else if (type === "BUTTONS") {
      newComponent.buttons = [];
    }

    setComponents([...components, newComponent]);
    form.setValue("components", [...components, newComponent]);
  };

  const removeComponent = (index: number) => {
    const newComponents = components.filter((_, i) => i !== index);
    setComponents(newComponents);
    form.setValue("components", newComponents);
  };

  const updateComponent = (
    index: number,
    updates: Partial<WabaTemplateComponent>
  ) => {
    const newComponents = [...components];
    newComponents[index] = { ...newComponents[index], ...updates };
    setComponents(newComponents);
    form.setValue("components", newComponents);
  };

  const moveComponent = (index: number, direction: "up" | "down") => {
    const newComponents = [...components];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newComponents.length) {
      [newComponents[index], newComponents[targetIndex]] = [
        newComponents[targetIndex],
        newComponents[index],
      ];
      setComponents(newComponents);
      form.setValue("components", newComponents);
    }
  };

  const addButton = (componentIndex: number) => {
    const component = components[componentIndex];
    if (component.type === "BUTTONS") {
      const newButtons = [
        ...(component.buttons || []),
        { type: "QUICK_REPLY" as WabaTemplateComponentButtonType, text: "" },
      ];
      updateComponent(componentIndex, { buttons: newButtons });
    }
  };

  const updateButton = (
    componentIndex: number,
    buttonIndex: number,
    updates: Partial<NonNullable<WabaTemplateComponent["buttons"]>[number]>
  ) => {
    const component = components[componentIndex];
    if (component.type === "BUTTONS" && component.buttons) {
      const newButtons = [...component.buttons];
      newButtons[buttonIndex] = { ...newButtons[buttonIndex], ...updates };
      updateComponent(componentIndex, { buttons: newButtons });
    }
  };

  const removeButton = (componentIndex: number, buttonIndex: number) => {
    const component = components[componentIndex];
    if (component.type === "BUTTONS" && component.buttons) {
      const newButtons = component.buttons.filter((_, i) => i !== buttonIndex);
      updateComponent(componentIndex, { buttons: newButtons });
    }
  };

  const hasComponentType = (type: WabaTemplateComponentType) => {
    return components.some((c) => c.type === type);
  };

  const countVariables = (text: string) => {
    return (text.match(/\{\{\d+\}\}/g) || []).length;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="welcome_message"
                      {...field}
                      disabled={!!template}
                    />
                  </FormControl>
                  <FormDescription>
                    Lowercase letters, numbers, and underscores only. Cannot be
                    changed after creation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                      <SelectItem value="AUTHENTICATION">
                        Authentication
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Marketing: Promotional content. Utility: Account updates,
                    orders. Authentication: OTP codes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en_US">English (US)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Template Components */}
        <Card>
          <CardHeader>
            <CardTitle>Template Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Component Buttons */}
            <div className="flex gap-2 flex-wrap">
              {!hasComponentType("HEADER") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addComponent("HEADER")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Header
                </Button>
              )}
              {!hasComponentType("BODY") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addComponent("BODY")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Body
                </Button>
              )}
              {!hasComponentType("FOOTER") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addComponent("FOOTER")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Footer
                </Button>
              )}
              {!hasComponentType("BUTTONS") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addComponent("BUTTONS")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Buttons
                </Button>
              )}
            </div>

            {/* Component List */}
            <div className="space-y-4">
              {components.map((component, index) => (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge>{component.type}</Badge>
                        {component.text && (
                          <span className="text-xs text-gray-500">
                            {countVariables(component.text)} variable(s)
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {index > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveComponent(index, "up")}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                        )}
                        {index < components.length - 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveComponent(index, "down")}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeComponent(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {component.type === "HEADER" && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">Format</label>
                          <Select
                            value={component.format}
                            onValueChange={(value) =>
                              updateComponent(index, {
                                format: value as WabaTemplateComponentFormat,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="TEXT">Text</SelectItem>
                              <SelectItem value="IMAGE">Image</SelectItem>
                              <SelectItem value="VIDEO">Video</SelectItem>
                              <SelectItem value="DOCUMENT">Document</SelectItem>
                              <SelectItem value="LOCATION">Location</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {component.format === "TEXT" && (
                          <div>
                            <label className="text-sm font-medium">
                              Header Text
                            </label>
                            <Input
                              placeholder="Enter header text"
                              value={component.text || ""}
                              onChange={(e) =>
                                updateComponent(index, { text: e.target.value })
                              }
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Use {`{{1}}`}, {`{{2}}`} for variables
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {(component.type === "BODY" ||
                      component.type === "FOOTER") && (
                      <div>
                        <label className="text-sm font-medium">
                          {component.type === "BODY"
                            ? "Body Text *"
                            : "Footer Text"}
                        </label>
                        <Textarea
                          placeholder={`Enter ${component.type.toLowerCase()} text`}
                          value={component.text || ""}
                          onChange={(e) =>
                            updateComponent(index, { text: e.target.value })
                          }
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use {`{{1}}`}, {`{{2}}`} for variables
                        </p>
                      </div>
                    )}

                    {component.type === "BUTTONS" && (
                      <div className="space-y-3">
                        {component.buttons?.map((button, buttonIndex) => (
                          <Card key={buttonIndex} className="p-3">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">
                                  Button {buttonIndex + 1}
                                </label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeButton(index, buttonIndex)
                                  }
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                              <Select
                                value={button.type}
                                onValueChange={(value) =>
                                  updateButton(index, buttonIndex, {
                                    type: value as WabaTemplateComponentButtonType,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="QUICK_REPLY">
                                    Quick Reply
                                  </SelectItem>
                                  <SelectItem value="URL">URL</SelectItem>
                                  <SelectItem value="PHONE_NUMBER">
                                    Phone Number
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Button text"
                                value={button.text}
                                onChange={(e) =>
                                  updateButton(index, buttonIndex, {
                                    text: e.target.value,
                                  })
                                }
                              />
                              {button.type === "URL" && (
                                <Input
                                  placeholder="https://example.com"
                                  value={button.url || ""}
                                  onChange={(e) =>
                                    updateButton(index, buttonIndex, {
                                      url: e.target.value,
                                    })
                                  }
                                />
                              )}
                              {button.type === "PHONE_NUMBER" && (
                                <Input
                                  placeholder="+1234567890"
                                  value={button.phone_number || ""}
                                  onChange={(e) =>
                                    updateButton(index, buttonIndex, {
                                      phone_number: e.target.value,
                                    })
                                  }
                                />
                              )}
                            </div>
                          </Card>
                        ))}
                        {(component.buttons?.length || 0) < 3 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addButton(index)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Button
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : template
                ? "Update Template"
                : "Create Template"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
