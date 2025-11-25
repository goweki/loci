import * as React from "react";
import PhoneInput from "react-phone-number-input";
import { Input } from "./input";

type InputPhoneProps = {
  value: string;
  setValue: (value?: string) => void;
  inputComponent?: React.ElementType;
  disabled?: boolean;
  name?: string;
};

const InputPhone: React.FC<InputPhoneProps> = ({
  value,
  setValue,
  disabled = false,
  name = "phone-number",
}) => {
  return (
    <PhoneInput
      name={name}
      disabled={disabled}
      value={value}
      onChange={setValue}
      inputComponent={Input}
    />
  );
};
InputPhone.displayName = "InputPhone";

export default InputPhone;
