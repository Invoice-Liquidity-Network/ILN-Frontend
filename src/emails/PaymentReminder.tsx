import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface PaymentReminderEmailProps {
  invoiceId: string;
  amount: string;
  token: string;
  dueDate: string;
  payerLink: string;
  payNowLink: string;
}

export const PaymentReminderEmail = ({
  invoiceId,
  amount,
  token,
  dueDate,
  payerLink,
  payNowLink,
}: PaymentReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Payment Reminder: Invoice #{invoiceId} is due soon</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Reminder</Heading>
        <Text style={text}>
          This is a reminder that your payment for invoice <strong>#{invoiceId}</strong> is due on <strong>{dueDate}</strong>.
        </Text>
        <Section style={amountSection}>
          <Text style={amountLabel}>Amount Due</Text>
          <Text style={amountValue}>{amount} {token}</Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={payNowLink}>
            Pay Now
          </Button>
        </Section>
        <Text style={text}>
          You can also view the invoice details on your <Link href={payerLink} style={link}>Payer Dashboard</Link>.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          If you have already paid this invoice, please ignore this email.
          <br />
          <Link href="{{unsubscribe_url}}" style={link}>Unsubscribe</Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  textAlign: "center" as const,
};

const amountSection = {
  backgroundColor: "#f4f4f4",
  borderRadius: "8px",
  margin: "24px 0",
  padding: "24px",
  textAlign: "center" as const,
};

const amountLabel = {
  margin: "0",
  color: "#666",
  fontSize: "14px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const amountValue = {
  margin: "8px 0 0",
  color: "#333",
  fontSize: "32px",
  fontWeight: "bold",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#0070f3",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px 32px",
};

const link = {
  color: "#0070f3",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "22px",
  textAlign: "center" as const,
};

export default PaymentReminderEmail;
