import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { main, container, text, button, anchor } from "./_styles";
import { BASE_URL } from "@/lib/utils/getUrl";

interface ResetPasswordEmailProps {
  name: string;
  resetPasswordLink?: string;
}

const ResetPasswordHtml = ({
  name,
  resetPasswordLink,
}: ResetPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>Reset Password - Rabee</Preview>
        <Container style={container}>
          <Img
            src={`${BASE_URL}/banner_sm.png`}
            width="235"
            height="100"
            alt="rabee"
          />
          <Section>
            <Text style={text}>Hi {name},</Text>
            <Text style={text}>
              Someone recently requested a password change for your Rabee
              account. If this was you, you can set a new password here:
            </Text>
            <Button style={button} href={resetPasswordLink}>
              Reset password
            </Button>
            <Text style={text}>
              If you don&apos;t want to change your password or didn&apos;t
              request this, just ignore and delete this message.
            </Text>
            <Text style={text}>
              To keep your account secure, please don&apos;t forward this email
              to anyone. Contact support in case you nned assistance via{" "}
              <Link style={anchor} href="mailto:rabee@goweki.com">
                rabee@goweki.com
              </Link>
            </Text>
            <Text style={text}>Have a productive time!</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const resetPasswordText = ({
  name,
  resetPasswordLink,
}: ResetPasswordEmailProps) =>
  `Hello ${name},
Someone recently requested a password change for your Rabee
account. If this was you, you can set a new password here: ${resetPasswordLink}

If you don't want to change your password or didn't
request this, just ignore and delete this message.

The link is valid for only 1 hour. If you have any questions, feel free 
to contact support via rabee@goweki.com

Best regards,
Team - Rabee`;

ResetPasswordHtml.PreviewProps = {
  name: "Antonio",
  resetPasswordLink: "https://www.goweki.com",
} as ResetPasswordEmailProps;

export { ResetPasswordHtml, resetPasswordText };
