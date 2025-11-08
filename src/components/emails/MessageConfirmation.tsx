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
import { main, container, text, highlight } from "./_styles";
import { BASE_URL } from "@/lib/utils/getUrl";

interface MessageEmailProps {
  name: string;
  message: string;
}

const ConfirmHtml = ({ name, message }: MessageEmailProps) => {
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
              Thank you for contacting Rabee. We&apos;ve received your message
              and will get back to you with a response in the coming days.
            </Text>
            <Text style={text}>Find a copy of your message below:</Text>
            <Text style={{ ...highlight, marginBottom: "1.5rem" }}>
              {message}
            </Text>
            <Text style={text}>- Rabee</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const confirmEmailText = ({ name, message }: MessageEmailProps) =>
  `Hello ${name},
Thank you for contacting Rabee. We've received your 
message and will get back to you with a response in the 
coming days.

Here is a copy of your message: ${message}

Regards,
- Rabee`;

ConfirmHtml.PreviewProps = {
  name: "Antonio",
  message: "Hello Rabee",
} as MessageEmailProps;

export { ConfirmHtml as ConfirmEmail, confirmEmailText as confirmEmailText };
