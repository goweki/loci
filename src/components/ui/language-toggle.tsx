"use client";

import { useI18n } from "@/lib/i18n";
import { languages, type Language } from "@/lib/i18n/i18n-settings"; // Adjust path
import { Button } from "./button";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  const otherLang = languages.find((lang) => lang !== language) as Language;

  const handleToggle = () => {
    setLanguage(otherLang);
  };

  return (
    <Button variant="outline" onClick={handleToggle}>
      <Languages />
    </Button>
  );
}
