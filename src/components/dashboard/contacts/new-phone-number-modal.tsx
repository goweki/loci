import React, { useState } from "react";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import InputPhone from "@/components/ui/input-phone";
import toast from "react-hot-toast";
import Loader from "@/components/ui/loaders";

export interface ModalProps {
  show: boolean;
  setShow: (val: boolean) => void;
}

export default function WhatsAppFormModal({ show, setShow }: ModalProps) {
  const [step, setStep] = useState<1 | 2 | null>(1);
  const [formData, setFormData] = useState({
    whatsappPhoneNumber: "",
    whatsappDisplayName: "",
    pinCode: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNextStep = () => {
    // Validate first step
    if (!formData.whatsappPhoneNumber || !formData.whatsappDisplayName) {
      toast.error(
        `Please fill in ${!formData.whatsappPhoneNumber ? "the WhatsApp Number" : "the Display Name"}`
      );
      return;
    }

    // send the PIN to the phone
    console.log("Sending PIN to:", formData.whatsappPhoneNumber);
    setStep(2);
  };

  const handlePreviousStep = () => {
    setStep(1);
  };

  const handleSubmit = () => {
    // Validate PIN
    if (!formData.pinCode) {
      alert("Please enter the PIN code");
      return;
    }

    console.log("Submitting form:", formData);
    // Add your submission logic here

    // Reset and close
    setFormData({
      whatsappPhoneNumber: "",
      whatsappDisplayName: "",
      pinCode: "",
    });
    setStep(1);
    setShow(false);
  };

  const handleCancel = () => {
    setFormData({
      whatsappPhoneNumber: "",
      whatsappDisplayName: "",
      pinCode: "",
    });
    setStep(1);
    setShow(false);
  };

  return !step ? (
    <Loader />
  ) : show ? (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-40 !m-0">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex flex-row">
            <span className=" flex flex-1">
              {step === 1 ? "Add WhatsApp Phone" : "Verify PIN Code"}
            </span>
            <Button size="sm" onClick={handleCancel} variant="destructive">
              <X className="w-5 h-5" />
            </Button>
          </CardTitle>
          <CardDescription>
            <div>
              <p className="text-sm mt-1">Step {step} of 2</p>
              {/* Progress Indicator */}
              <div className="flex gap-2 mt-2">
                <div
                  className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-secondary"}`}
                />
                <div
                  className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-secondary"}`}
                />
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Step 1: Phone Number and Display Name */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Phone Number *
                  </label>
                  <InputPhone
                    name="whatsappPhoneNumber"
                    value={formData.whatsappPhoneNumber}
                    setValue={(val) => {
                      if (val)
                        setFormData((prev) => ({
                          ...prev,
                          whatsappPhoneNumber: val,
                        }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Display Name *
                  </label>
                  <Input
                    type="text"
                    name="whatsappDisplayName"
                    value={formData.whatsappDisplayName}
                    onChange={handleInputChange}
                    placeholder="eg. Customer Support"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  {/* <Button onClick={handleCancel} variant="destructive">
                    Cancel
                  </Button> */}
                  <Button onClick={handleNextStep} className="flex-1">
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {/* Step 2: PIN Verification */}
            {step === 2 && (
              <>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
                  <p className="text-sm">A PIN code has been sent to:</p>
                  <p className="text-lg font-semibold mt-1">
                    {formData.whatsappPhoneNumber}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Enter PIN Code *
                  </label>
                  <Input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleInputChange}
                    placeholder="_ _ _ _ _ _"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Please enter the 6-digit PIN code sent to your phone
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handlePreviousStep}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1">
                    Verify & Save
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  ) : null;
}
