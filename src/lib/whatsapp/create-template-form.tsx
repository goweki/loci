import React, { useCallback, useState } from "react";
import { Plus, Trash2, Send } from "lucide-react";

type ComponentType = "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
type HeaderFormat = "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
type ButtonType = "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
type TemplateCategory = "UTILITY" | "MARKETING" | "AUTHENTICATION";

interface Button {
  type: ButtonType;
  text: string;
  url?: string;
  phone_number?: string;
}

interface TemplateComponent {
  type: ComponentType;
  format?: HeaderFormat;
  text?: string;
  buttons?: Button[];
}

interface Template {
  name: string;
  language: string;
  category: TemplateCategory;
  components: TemplateComponent[];
}

export default function TemplateBuilder() {
  const [template, setTemplate] = useState<Template>({
    name: "",
    language: "en_US",
    category: "UTILITY",
    components: [],
  });

  const [preview, setPreview] = useState<string>("");

  const addComponent = (type: ComponentType) => {
    const newComponent: TemplateComponent = { type };

    if (type === "HEADER") {
      newComponent.format = "TEXT";
      newComponent.text = "";
    } else if (type === "BODY") {
      newComponent.text = "";
    } else if (type === "FOOTER") {
      newComponent.text = "";
    } else if (type === "BUTTONS") {
      newComponent.buttons = [];
    }

    setTemplate((prev) => ({
      ...prev,
      components: [...prev.components, newComponent],
    }));
  };

  const removeComponent = (index: number) => {
    setTemplate((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index),
    }));
  };

  const updateComponent = (
    index: number,
    field: keyof TemplateComponent,
    value: string | HeaderFormat,
  ) => {
    setTemplate((prev) => ({
      ...prev,
      components: prev.components.map((comp, i) =>
        i === index ? { ...comp, [field]: value } : comp,
      ),
    }));
  };

  const addButton = (componentIndex: number) => {
    setTemplate((prev) => ({
      ...prev,
      components: prev.components.map((comp, i) =>
        i === componentIndex
          ? {
              ...comp,
              buttons: [
                ...(comp.buttons || []),
                { type: "QUICK_REPLY", text: "" },
              ],
            }
          : comp,
      ),
    }));
  };

  const updateButton = (
    componentIndex: number,
    buttonIndex: number,
    field: keyof Button,
    value: string | ButtonType,
  ) => {
    setTemplate((prev) => ({
      ...prev,
      components: prev.components.map((comp, i) =>
        i === componentIndex
          ? {
              ...comp,
              buttons: comp.buttons?.map((btn, j) =>
                j === buttonIndex ? { ...btn, [field]: value } : btn,
              ),
            }
          : comp,
      ),
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Template created successfully! Status: " + data.status);
      } else {
        alert("Error: " + (data.error || "Failed to create template"));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert("Error: " + errorMessage);
    }
  };

  const generatePreview = useCallback(() => {
    let text = "";
    template.components.forEach((comp) => {
      if (comp.type === "HEADER" && comp.format === "TEXT") {
        text += `*${comp.text}*\n\n`;
      } else if (comp.type === "BODY") {
        text += `${comp.text}\n\n`;
      } else if (comp.type === "FOOTER") {
        text += `_${comp.text}_\n\n`;
      } else if (comp.type === "BUTTONS") {
        comp.buttons?.forEach((btn, i) => {
          text += `[${btn.text || "Button " + (i + 1)}]\n`;
        });
      }
    });
    setPreview(text);
  }, []);

  React.useEffect(() => {
    generatePreview();
  }, [template, generatePreview]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            WhatsApp Template Builder
          </h1>
          <p className="text-gray-600">
            Create message templates for WhatsApp Business API
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Builder Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={template.name}
                  onChange={(e) =>
                    setTemplate((prev) => ({
                      ...prev,
                      name: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    }))
                  }
                  placeholder="welcome_message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lowercase with underscores only
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={template.category}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        category: e.target.value as TemplateCategory,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="UTILITY">Utility</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={template.language}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        language: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="en_US">English (US)</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Components
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => addComponent("HEADER")}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                    >
                      + Header
                    </button>
                    <button
                      onClick={() => addComponent("BODY")}
                      className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100"
                    >
                      + Body
                    </button>
                    <button
                      onClick={() => addComponent("FOOTER")}
                      className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100"
                    >
                      + Footer
                    </button>
                    <button
                      onClick={() => addComponent("BUTTONS")}
                      className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
                    >
                      + Buttons
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {template.components.map((comp, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600 uppercase">
                          {comp.type}
                        </span>
                        <button
                          onClick={() => removeComponent(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {comp.type === "HEADER" && (
                        <>
                          <select
                            value={comp.format}
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "format",
                                e.target.value as HeaderFormat,
                              )
                            }
                            className="w-full px-2 py-1 text-sm border rounded mb-2"
                          >
                            <option value="TEXT">Text</option>
                            <option value="IMAGE">Image</option>
                            <option value="VIDEO">Video</option>
                            <option value="DOCUMENT">Document</option>
                          </select>
                          {comp.format === "TEXT" && (
                            <input
                              type="text"
                              value={comp.text || ""}
                              onChange={(e) =>
                                updateComponent(index, "text", e.target.value)
                              }
                              placeholder="Header text (max 60 chars)"
                              maxLength={60}
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                          )}
                        </>
                      )}

                      {comp.type === "BODY" && (
                        <textarea
                          value={comp.text || ""}
                          onChange={(e) =>
                            updateComponent(index, "text", e.target.value)
                          }
                          placeholder="Body text (max 1024 chars). Use {{1}}, {{2}} for variables"
                          maxLength={1024}
                          rows={3}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      )}

                      {comp.type === "FOOTER" && (
                        <input
                          type="text"
                          value={comp.text || ""}
                          onChange={(e) =>
                            updateComponent(index, "text", e.target.value)
                          }
                          placeholder="Footer text (max 60 chars)"
                          maxLength={60}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      )}

                      {comp.type === "BUTTONS" && (
                        <div className="space-y-2">
                          {comp.buttons?.map((btn, btnIndex) => (
                            <div
                              key={btnIndex}
                              className="flex gap-2 flex-wrap"
                            >
                              <select
                                value={btn.type}
                                onChange={(e) =>
                                  updateButton(
                                    index,
                                    btnIndex,
                                    "type",
                                    e.target.value as ButtonType,
                                  )
                                }
                                className="px-2 py-1 text-xs border rounded"
                              >
                                <option value="QUICK_REPLY">Quick Reply</option>
                                <option value="URL">URL</option>
                                <option value="PHONE_NUMBER">Phone</option>
                              </select>
                              <input
                                type="text"
                                value={btn.text || ""}
                                onChange={(e) =>
                                  updateButton(
                                    index,
                                    btnIndex,
                                    "text",
                                    e.target.value,
                                  )
                                }
                                placeholder="Button text"
                                maxLength={25}
                                className="flex-1 min-w-0 px-2 py-1 text-xs border rounded"
                              />
                              {btn.type === "URL" && (
                                <input
                                  type="url"
                                  value={btn.url || ""}
                                  onChange={(e) =>
                                    updateButton(
                                      index,
                                      btnIndex,
                                      "url",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="https://..."
                                  className="flex-1 min-w-0 px-2 py-1 text-xs border rounded"
                                />
                              )}
                              {btn.type === "PHONE_NUMBER" && (
                                <input
                                  type="tel"
                                  value={btn.phone_number || ""}
                                  onChange={(e) =>
                                    updateButton(
                                      index,
                                      btnIndex,
                                      "phone_number",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="+1234567890"
                                  className="flex-1 min-w-0 px-2 py-1 text-xs border rounded"
                                />
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addButton(index)}
                            className="text-xs text-purple-600 hover:text-purple-700"
                          >
                            + Add Button
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                <Send size={16} />
                Create Template
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Preview
            </h3>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                  {preview || "Add components to see preview..."}
                </pre>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600">
              <p className="font-semibold mb-2">Template Info:</p>
              <p>Name: {template.name || "Not set"}</p>
              <p>Category: {template.category}</p>
              <p>Language: {template.language}</p>
              <p>Components: {template.components.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
