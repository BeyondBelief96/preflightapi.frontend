import {
  Body,
  Container,
  Head,
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
          <Text style={paragraph}>Hey {name},</Text>

          <Text style={paragraph}>
            Brandon here. Thanks for signing up for PreflightAPI. I built this
            because I wanted a single, reliable API for aviation data — and I
            hope it saves you the same headaches it saved me.
          </Text>

          <Text style={paragraph}>
            You&apos;re on the free Student Pilot tier with 5,000 API calls per
            month. Here&apos;s how to get going:
          </Text>

          <Section style={steps}>
            <Text style={step}>
              <strong>1.</strong>{' '}
              <Link href={`${baseUrl}/docs/getting-started`} style={link}>
                Quick Start guide
              </Link>{' '}
              — make your first call in under a minute
            </Text>
            <Text style={step}>
              <strong>2.</strong>{' '}
              <Link href={`${baseUrl}/dashboard/keys`} style={link}>
                Grab your API key
              </Link>
            </Text>
            <Text style={step}>
              <strong>3.</strong>{' '}
              <Link href={`${baseUrl}/docs`} style={link}>
                Browse the docs
              </Link>{' '}
              — METARs, TAFs, NOTAMs, and more
            </Text>
          </Section>

          <Text style={paragraph}>
            Need more calls or premium endpoints?{' '}
            <Link href={`${baseUrl}/pricing`} style={link}>
              Check out the plans
            </Link>
            .
          </Text>

          <Text style={paragraph}>
            If you run into anything or just want to say hi, reply to this
            email. I read every one.
          </Text>

          <Text style={{ ...paragraph, marginTop: '32px' }}>— Brandon</Text>

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
