"use client";

import * as React from "react";
import {
  InputOTP as InputOTPDefault,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface InputOtpProps {
  value: string;
  setValue: (val: string) => void;
}

export function InputOTP(props: InputOtpProps) {
  const { value, setValue } = props;

  return (
    <div className="space-y-2 ">
      <InputOTPDefault
        maxLength={6}
        value={value}
        onChange={(value) => setValue(value)}
      >
        <InputOTPGroup className="mx-auto">
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTPDefault>
      <div className="text-center text-sm">
        {value === "" ? (
          <>Enter your one-time password.</>
        ) : (
          <>You entered: {value}</>
        )}
      </div>
    </div>
  );
}
