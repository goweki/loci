"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import InputPhone from "@/components/ui/input-phone";

export default function NewContactForm() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    phoneNumber: "",
    name: "",
    avatar: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.phoneNumber) {
      toast.error("Phone number is required");
      return;
    }

    try {
      setLoading(true);

      // 👉 Replace with your actual server action
      await fetch("/api/contacts", {
        method: "POST",
        body: JSON.stringify(form),
      });

      toast.success("Contact created");

      setForm({
        phoneNumber: "",
        name: "",
        avatar: "",
      });
    } catch (err) {
      toast.error("Failed to create contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Phone */}
      <div>
        <label className="text-sm font-medium mb-2 block">Phone Number *</label>
        <InputPhone
          name="phoneNumber"
          value={form.phoneNumber}
          setValue={(val) =>
            setForm((prev) => ({
              ...prev,
              phoneNumber: val || "",
            }))
          }
        />
      </div>

      {/* Name */}
      <div>
        <label className="text-sm font-medium mb-2 block">Name</label>
        <Input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. John Doe"
        />
      </div>

      {/* Avatar */}
      <div>
        <label className="text-sm font-medium mb-2 block">Avatar URL</label>
        <Input
          name="avatar"
          value={form.avatar}
          onChange={handleChange}
          placeholder="https://..."
        />
      </div>
    </div>
  );
}
