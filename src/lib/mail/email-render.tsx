import { render } from "@react-email/render";
import React from "react";
import { WelcomeEmail, welcomeEmailText } from "@/components/emails/Welcome";
import {
  ConfirmEmail,
  confirmEmailText,
} from "@/components/emails/MessageConfirmation";
import {
  ResetPasswordHtml,
  resetPasswordText,
} from "@/components/emails/ResetPassword";

/**
 * Renders a React component to a static HTML string.
 * @param component The React component to render.
 * @returns The HTML string representation of the component.
 */
async function renderEmailHtml(component: React.ReactElement): Promise<string> {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Email</title>
</head>
<body>
    ${await render(component)}
</body>
</html>`;
}

export const welcomeEmail = async (
  name: string,
  onboardLink: string
): Promise<{ html: string; text: string }> => {
  const emailHtml = await renderEmailHtml(
    <WelcomeEmail name={name} onboardLink={onboardLink} />
  );
  const emailText = welcomeEmailText({ name, onboardLink });

  return { html: emailHtml, text: emailText };
};

export const resetPasswordEmail = async (
  name: string,
  resetPasswordLink: string
) => {
  const emailHtml = await renderEmailHtml(
    <ResetPasswordHtml name={name} resetPasswordLink={resetPasswordLink} />
  );
  const emailText = resetPasswordText({
    name,
    resetPasswordLink: resetPasswordLink,
  });

  return { html: emailHtml, text: emailText };
};

export const messageConfirmationEmail = async (
  name: string,
  message: string
) => {
  const emailHtml = await renderEmailHtml(
    <ConfirmEmail name={name} message={message} />
  );
  const emailText = confirmEmailText({ name, message });

  return { html: emailHtml, text: emailText };
};
