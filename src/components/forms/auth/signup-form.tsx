"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(2).max(50),
});

interface SignUpProps {
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
}

export function SignUpForm(copy: SignUpProps) {
  const { emailLabel, passwordLabel, submitLabel } = copy;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 text-start"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{emailLabel}</FormLabel>
              <FormControl>
                <Input placeholder="loci@goweki.com..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => {
            const [show, setShow] = useState(false);
            return (
              <FormItem>
                <FormLabel>{passwordLabel}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={show ? "text" : "password"}
                      {...field}
                      className="pr-10"
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShow(!show)}
                    className="absolute right-0 top-0 h-full px-3"
                  >
                    {show ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
        <div className="pt-4">
          <Button type="submit" className="w-full">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
