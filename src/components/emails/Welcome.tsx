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

interface WelcomeEmailProps {
  name: string;
  onboardLink: string;
}

const WelcomeHtml = ({ name, onboardLink }: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>Welcome to Rabee</Preview>
        <Container style={container}>
          <Img
            src={`${BASE_URL}/banner_sm.png`}
            width="235"
            height="100"
            alt="banner"
          />
          <Section>
            <Text style={text}>Hello {name},</Text>
            <Text style={text}>
              Thank you for signing up to Rabee. We&apos;re excited to have you
              on board! We look forward to helping you optimize learning.
            </Text>
            <Text style={text}>
              To finish setting up your account, create a new password using
              this link below:
            </Text>
            <Button style={button} href={onboardLink}>
              Set password
            </Button>
            <Text style={text}>
              If you don&apos;t sign-up, ignore or didn&apos;t you may just
              ignore and delete this message. The link is valid for only 1 hour
            </Text>
            <Text style={text}>
              To keep your account secure, please don&apos;t forward this email
              to anyone. Contact support in case you need assistance via{" "}
              <Link style={anchor} href="mailto:rabee@goweki.com">
                rabee@goweki.com
              </Link>
            </Text>
            <Text style={text}>See you around!</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const welcomeEmailText = ({ name, onboardLink }: WelcomeEmailProps) =>
  `Hello ${name},
Thank you for signing up to Rabee. We're excited to have you onboard! 
& look forward to helping you optimize learning.

To finish setting up your account, create a new password using
              this link: ${onboardLink}

The link is valid for only 1 hour. If you have any questions, feel free 
to contact support via rabee@goweki.com

Best regards,
Team - Rabee`;

WelcomeHtml.PreviewProps = {
  name: "Antonio",
  onboardLink: "https://www.goweki.com",
} as WelcomeEmailProps;

export { WelcomeHtml as WelcomeEmail, welcomeEmailText };
