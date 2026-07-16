"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Currency } from "@/lib/prisma/generated";

interface InputPriceProps {
  price: string; // Changed to string to allow empty state ("") when user clears input
  onPriceChange: (value: string) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  id?: string;
  label?: string;
}

export default function InputPrice({
  price,
  onPriceChange,
  currency,
  onCurrencyChange,
  id = "price-input",
  label = "Price",
}: InputPriceProps) {
  // Handles safe decimal formatting on blur if needed, or keeps it clean
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Basic regex: allow numbers and up to one decimal point
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      onPriceChange(val);
    }
  };

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative flex items-center rounded-md shadow-sm">
        {/* Price Input */}
        <Input
          id={id}
          type="text" // Using text with regex matching ensures perfect UX without browser spinner arrows interfering
          inputMode="decimal" // Displays a decimal pad on mobile devices
          placeholder="0.00"
          value={price}
          onChange={handlePriceChange}
          className="pl-3 pr-24 focus-visible:ring-1 focus-visible:ring-ring"
        />

        {/* Currency Dropdown inside the Input */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger
              className="h-7 w-20 border-none shadow-none bg-transparent hover:bg-muted/50 focus:ring-0 focus:ring-offset-0 text-xs font-medium gap-1 px-2"
              aria-label="Select currency"
            >
              <SelectValue placeholder="USD" />
            </SelectTrigger>
            <SelectContent align="end" className="w-24">
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="KES">KES (KSh)</SelectItem>
              {/* <SelectItem value="EUR">EUR (€)</SelectItem> */}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
