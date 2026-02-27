import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from '@react-email/components'
import sanitizeHtml from 'sanitize-html'

interface AdminBroadcastEmailProps {
  content: string
  previewText?: string
}

const baseUrl = 'https://preflightapi.io'

export function AdminBroadcastEmail({
  content,
  previewText,
}: AdminBroadcastEmailProps) {
  return (
    <Html>
      <Head />
      {previewText && <Preview>{previewText}</Preview>}
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>PreflightAPI</Text>

          <div
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
            style={contentSection}
          />

          <Hr style={hr} />

          <Text style={footer}>
            You&apos;re receiving this because you have a{' '}
            <Link href={baseUrl} style={footerLink}>
              PreflightAPI
            </Link>{' '}
            account.{' '}
            <Link href="{{{RESEND_UNSUBSCRIBE_URL}}}" style={footerLink}>
              Manage your email preferences
            </Link>{' '}
            or contact{' '}
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

export default AdminBroadcastEmail

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
  fontSize: '20px',
  fontWeight: '600' as const,
  marginBottom: '24px',
}

const contentSection = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
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
