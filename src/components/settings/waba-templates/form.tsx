"use client";

import React, { useState } from "react";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { createTemplate } from "./actions/create-template";
import {
  TemplateBuilder,
  templateBuilderSchema,
  builderToTemplate,
} from "@/lib/whatsapp/types/waba-template";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
  TemplateCategory,
  TemplateLanguage,
  WabaTemplate,
} from "@/lib/prisma/generated";

type AuthFormData = Extract<TemplateBuilder, { category: "AUTHENTICATION" }>;
type NonAuthFormData = Extract<
  TemplateBuilder,
  { category: "UTILITY" | "MARKETING" }
>;
type FormData = AuthFormData | NonAuthFormData;

/* --------------------- Form Component --------------------- */

const WabaTemplateForm = () => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<FormData>>({
    name: "",
    language: TemplateLanguage.en_US,
    category: TemplateCategory.UTILITY,
    body: { text: "" },
  });
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }
  const userId = session.user.id;

  const isAuth = formData.category === TemplateCategory.AUTHENTICATION;
  const maxSteps = isAuth ? 3 : 4;

  // Type-safe access to form data
  const nonAuthData = !isAuth ? (formData as Partial<NonAuthFormData>) : null;
  const authData = isAuth ? (formData as Partial<AuthFormData>) : null;

  const updateFormData = (path: string, value: any) => {
    setFormData((prev) => {
      const keys = path.split(".");
      const newData = { ...prev };
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[path];
      return newErrors;
    });
  };

  const validateStep = (stepNum: number) => {
    try {
      if (stepNum === 1) {
        z.object({
          name: z.string().min(1),
          language: z.nativeEnum(TemplateLanguage),
          category: z.nativeEnum(TemplateCategory),
        }).parse({
          name: formData.name,
          language: formData.language,
          category: formData.category,
        });
      } else if (stepNum === 2) {
        z.object({
          body: z.object({
            text: z.string().min(1),
          }),
        }).parse({ body: formData.body });
      }
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((e) => {
          newErrors[e.path.join(".")] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleSubmit = async () => {
    try {
      const validated = templateBuilderSchema.parse(formData);
      console.log("Validated builder:", JSON.stringify(validated, null, 2));

      const template = builderToTemplate(validated);
      console.log("Converted template:", JSON.stringify(template, null, 2));

      // Check the components array specifically
      console.log(
        "Template components:",
        JSON.stringify(template.components, null, 2)
      );

      const augmented = { ...template, createdById: userId };
      const newTemplate: WabaTemplate = await createTemplate(augmented);
      toast.success(`Template created: ${newTemplate.name}`);
    } catch (err) {
      // ...
    }
  };

  const addButton = () => {
    if (isAuth) {
      updateFormData("buttons", [
        { type: "OTP", otp_type: "COPY_CODE", text: "Copy code" },
      ]);
    } else {
      const currentButtons = nonAuthData?.buttons || [];
      updateFormData("buttons", [
        ...currentButtons,
        { type: "QUICK_REPLY", text: "" },
      ]);
    }
  };

  const updateButton = (index: number, field: string, value: any) => {
    const buttons = [...((formData as any).buttons || [])];
    buttons[index] = { ...buttons[index], [field]: value };
    updateFormData("buttons", buttons);
  };

  const removeButton = (index: number) => {
    const buttons = ((formData as any).buttons || []).filter(
      (_: any, i: number) => i !== index
    );
    updateFormData("buttons", buttons.length > 0 ? buttons : undefined);
  };

  return (
    <div className="w-full mx-auto">
      {/* Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, ...(isAuth ? [] : [4])].map((s, i) => (
          <React.Fragment key={s}>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${
                s < step
                  ? "bg-green-500 text-white"
                  : s === step
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step ? <Check className="w-5 h-5" /> : s}
            </div>
            {i < (isAuth ? 2 : 3) && (
              <div
                className={`w-16 h-1 transition-colors ${s < step ? "bg-green-500" : "bg-gray-200"}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "Basic Information"}
            {step === 2 && "Message Body"}
            {step === 3 &&
              (isAuth ? "Authentication Settings" : "Header & Footer")}
            {step === 4 && "Buttons"}
          </CardTitle>
          <CardDescription>
            Step {step} of {maxSteps}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    updateFormData("name", e.target.value.toLowerCase())
                  }
                  placeholder="my_template_name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
                <p className="text-xs text-gray-500">
                  Lowercase letters, numbers, and underscores only
                </p>
              </div>

              <div className="space-y-2">
                <Label>Language *</Label>
                <Select
                  value={formData.language}
                  onValueChange={(v) => updateFormData("language", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TemplateLanguage.en_US}>
                      English (US)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <RadioGroup
                  value={formData.category}
                  onValueChange={(v) => updateFormData("category", v)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={TemplateCategory.UTILITY}
                      id="utility"
                    />
                    <Label
                      htmlFor="utility"
                      className="cursor-pointer font-normal"
                    >
                      Utility
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={TemplateCategory.MARKETING}
                      id="marketing"
                    />
                    <Label
                      htmlFor="marketing"
                      className="cursor-pointer font-normal"
                    >
                      Marketing
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={TemplateCategory.AUTHENTICATION}
                      id="auth"
                    />
                    <Label
                      htmlFor="auth"
                      className="cursor-pointer font-normal"
                    >
                      Authentication
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {/* Step 2: Body */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="bodyText">Message Body *</Label>
                <Textarea
                  id="bodyText"
                  value={formData.body?.text || ""}
                  onChange={(e) => updateFormData("body.text", e.target.value)}
                  rows={6}
                  placeholder="Your message text here..."
                />
                {errors["body.text"] && (
                  <p className="text-sm text-red-500">{errors["body.text"]}</p>
                )}
              </div>

              {isAuth && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addSecurityRecommendation"
                    checked={authData?.body?.addSecurityRecommendation || false}
                    onCheckedChange={(checked) =>
                      updateFormData("body.addSecurityRecommendation", checked)
                    }
                  />
                  <Label
                    htmlFor="addSecurityRecommendation"
                    className="cursor-pointer font-normal"
                  >
                    Add security recommendation
                  </Label>
                </div>
              )}

              {!isAuth && (
                <div className="space-y-2">
                  <Label>Body Variable Examples (Optional)</Label>
                  <p className="text-xs text-gray-500">
                    Add example values for variables in your body text
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const current = nonAuthData?.body?.example || [];
                      updateFormData("body.example", [...current, [""]]);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Example Set
                  </Button>

                  {/* Render example sets */}
                  {(nonAuthData?.body?.example || []).map(
                    (exampleSet: string[], setIndex: number) => (
                      <Card key={setIndex} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Example Set {setIndex + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const examples = [
                                ...(nonAuthData?.body?.example || []),
                              ];
                              examples.splice(setIndex, 1);
                              updateFormData(
                                "body.example",
                                examples.length > 0 ? examples : undefined
                              );
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                        {exampleSet.map((value: string, valueIndex: number) => (
                          <Input
                            key={valueIndex}
                            value={value}
                            onChange={(e) => {
                              const examples = [
                                ...(nonAuthData?.body?.example || []),
                              ];
                              examples[setIndex][valueIndex] = e.target.value;
                              updateFormData("body.example", examples);
                            }}
                            placeholder={`Variable ${valueIndex + 1} example`}
                          />
                        ))}
                      </Card>
                    )
                  )}
                </div>
              )}
            </>
          )}

          {/* Step 3: Auth Settings or Header/Footer */}
          {step === 3 && isAuth && authData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text (Optional)</Label>
                <Input
                  id="footerText"
                  value={authData.footer?.text || ""}
                  onChange={(e) =>
                    updateFormData("footer.text", e.target.value)
                  }
                  placeholder="Footer text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codeExpiration">
                  Code Expiration (minutes)
                </Label>
                <Input
                  id="codeExpiration"
                  type="number"
                  min={1}
                  max={90}
                  value={authData.footer?.codeExpirationMinutes || ""}
                  onChange={(e) =>
                    updateFormData(
                      "footer.codeExpirationMinutes",
                      parseInt(e.target.value) || undefined
                    )
                  }
                  placeholder="e.g., 10"
                />
                <p className="text-xs text-gray-500">
                  Must be between 1-90 minutes
                </p>
              </div>

              <div className="space-y-2">
                <Label>OTP Button Type</Label>
                <Select
                  value={authData.buttons?.[0]?.otp_type || "COPY_CODE"}
                  onValueChange={(v) => {
                    updateFormData("buttons", [
                      {
                        type: "OTP",
                        otp_type: v,
                        text: v === "COPY_CODE" ? "Copy code" : "Autofill",
                        ...(v === "ONE_TAP" && {
                          autofill_text: "Autofill",
                          package_name: "com.example.app",
                          signature_hash: "",
                        }),
                      },
                    ]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COPY_CODE">Copy Code</SelectItem>
                    <SelectItem value="ONE_TAP">One Tap</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {authData.buttons?.[0]?.otp_type === "ONE_TAP" && (
                <>
                  <Input
                    placeholder="Package name"
                    value={(authData.buttons[0] as any).package_name || ""}
                    onChange={(e) =>
                      updateButton(0, "package_name", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Signature hash"
                    value={(authData.buttons[0] as any).signature_hash || ""}
                    onChange={(e) =>
                      updateButton(0, "signature_hash", e.target.value)
                    }
                  />
                </>
              )}

              <Alert>
                <AlertDescription>
                  Authentication templates require exactly one OTP button.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === 3 && !isAuth && nonAuthData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Header Format (Optional)</Label>
                <Select
                  value={nonAuthData.header?.format || ""}
                  onValueChange={(v) => {
                    if (v) {
                      updateFormData("header.format", v);
                      // Initialize example for media headers
                      if (v === "IMAGE" || v === "VIDEO" || v === "DOCUMENT") {
                        updateFormData("header.example", {
                          header_handle: [""],
                        });
                      } else if (v === "TEXT") {
                        updateFormData("header.example", undefined);
                      }
                    } else {
                      updateFormData("header", undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
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

              {nonAuthData.header?.format === "TEXT" && (
                <div className="space-y-2">
                  <Label htmlFor="headerText">Header Text</Label>
                  <Input
                    id="headerText"
                    value={nonAuthData.header?.text || ""}
                    onChange={(e) =>
                      updateFormData("header.text", e.target.value)
                    }
                    placeholder="Header text"
                  />
                </div>
              )}

              {/* Example URL for media headers */}
              {(nonAuthData.header?.format === "IMAGE" ||
                nonAuthData.header?.format === "VIDEO" ||
                nonAuthData.header?.format === "DOCUMENT") && (
                <div className="space-y-2">
                  <Label htmlFor="headerExample">
                    Example {nonAuthData.header.format.toLowerCase()} URL *
                  </Label>
                  <Input
                    id="headerExample"
                    value={
                      nonAuthData.header?.example?.header_handle?.[0] || ""
                    }
                    onChange={(e) =>
                      updateFormData("header.example", {
                        header_handle: [e.target.value],
                      })
                    }
                    placeholder="https://example.com/sample-image.jpg"
                  />
                  <p className="text-xs text-gray-500">
                    Provide a sample URL for template approval
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="footerText">Footer Text (Optional)</Label>
                <Input
                  id="footerText"
                  value={nonAuthData.footer?.text || ""}
                  onChange={(e) =>
                    updateFormData("footer.text", e.target.value)
                  }
                  placeholder="Footer text"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500">Max 60 characters</p>
              </div>
            </div>
          )}

          {/* Step 4: Buttons (Non-Auth only) */}
          {step === 4 && !isAuth && nonAuthData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Buttons (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addButton}
                  disabled={(nonAuthData.buttons?.length || 0) >= 10}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Button
                </Button>
              </div>

              {(nonAuthData.buttons || []).map((btn: any, i: number) => (
                <Card key={i} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Button {i + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeButton(i)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>

                  <Select
                    value={btn.type}
                    onValueChange={(v) => {
                      const newBtn: any = { type: v, text: btn.text };
                      if (v === "URL") newBtn.url = "";
                      if (v === "PHONE_NUMBER") newBtn.phone_number = "";
                      updateButton(i, "type", v);
                      const buttons = [...((formData as any).buttons || [])];
                      buttons[i] = newBtn;
                      updateFormData("buttons", buttons);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                      <SelectItem value="URL">URL</SelectItem>
                      <SelectItem value="PHONE_NUMBER">Phone Number</SelectItem>
                      <SelectItem value="CATALOG">Catalog</SelectItem>
                      <SelectItem value="MPM">MPM</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    value={btn.text}
                    onChange={(e) => updateButton(i, "text", e.target.value)}
                    placeholder="Button text"
                    maxLength={25}
                  />

                  {btn.type === "URL" && (
                    <Input
                      value={btn.url || ""}
                      onChange={(e) => updateButton(i, "url", e.target.value)}
                      placeholder="https://example.com"
                    />
                  )}

                  {btn.type === "PHONE_NUMBER" && (
                    <Input
                      value={btn.phone_number || ""}
                      onChange={(e) =>
                        updateButton(i, "phone_number", e.target.value)
                      }
                      placeholder="+1234567890"
                    />
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < maxSteps ? (
              <Button type="button" onClick={handleNext}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit}>
                <Check className="w-4 h-4 mr-1" /> Create Template
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WabaTemplateForm;
