import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface WelcomeEmailProps {
  name: string
}

const baseUrl = 'https://preflightapi.io'

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to PreflightAPI — your API key is ready</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Welcome to PreflightAPI, {name}!</Heading>

          <Text style={paragraph}>
            Thanks for signing up. You now have access to our free Student Pilot
            tier with 500 API calls per month.
          </Text>

          <Text style={paragraph}>Here&apos;s how to get started:</Text>

          <Section style={steps}>
            <Text style={step}>
              <strong>1.</strong> Head to your{' '}
              <Link
                href={`${baseUrl}/dashboard/getting-started`}
                style={link}
              >
                Getting Started guide
              </Link>
            </Text>
            <Text style={step}>
              <strong>2.</strong> Grab your API key from the{' '}
              <Link href={`${baseUrl}/dashboard/keys`} style={link}>
                API Keys page
              </Link>
            </Text>
            <Text style={step}>
              <strong>3.</strong> Check out our{' '}
              <Link href={`${baseUrl}/docs`} style={link}>
                API documentation
              </Link>
            </Text>
          </Section>

          <Text style={paragraph}>
            Need more calls or access to premium endpoints? Check out our{' '}
            <Link href={`${baseUrl}/pricing`} style={link}>
              pricing plans
            </Link>
            .
          </Text>

          <Text style={{ ...paragraph, marginTop: '32px' }}>
            Happy flying!
            <br />
            The PreflightAPI Team
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            You&apos;re receiving this because you signed up for{' '}
            <Link href={baseUrl} style={footerLink}>
              PreflightAPI
            </Link>
            . If you have questions, reply to this email or contact{' '}
            <Link href="mailto:support@preflightapi.io" style={footerLink}>
              support@preflightapi.io
            </Link>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default WelcomeEmail

// --- Styles ---

const body = {
  backgroundColor: '#f8fafc',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}

const container = {
  backgroundColor: '#ffffff',
  maxWidth: '600px',
  margin: '40px auto',
  padding: '40px 32px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
}

const heading = {
  color: '#0f172a',
  fontSize: '24px',
  fontWeight: '600' as const,
  marginBottom: '16px',
}

const paragraph = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
}

const steps = {
  marginTop: '8px',
  marginBottom: '8px',
}

const step = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '4px 0',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline' as const,
}

const hr = {
  border: 'none',
  borderTop: '1px solid #e2e8f0',
  margin: '32px 0 16px',
}

const footer = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '1.5',
}

const footerLink = {
  color: '#94a3b8',
  textDecoration: 'underline' as const,
}
