import { HTTPError, defineHandler } from 'h3'
import { Webhook } from 'svix'
import { Resend } from 'resend'
import { createLogger } from '@/lib/server/logger'

const log = createLogger('clerk-webhook')

const HTML_ESCAPE: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(str: string): string {
  return str.replace(/[<>&"']/g, (c) => HTML_ESCAPE[c] ?? c)
}

interface ClerkUserEvent {
  data: {
    id: string
    email_addresses: Array<{
      email_address: string
      id: string
    }>
    first_name: string | null
    last_name: string | null
  }
  type: string
}

export default defineHandler(async (event) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    log.error('CLERK_WEBHOOK_SECRET not configured')
    throw new HTTPError({
      statusCode: 500,
      statusMessage: 'Webhook secret not configured',
    })
  }

  const body = await event.req.text()
  const svixId = event.req.headers.get('svix-id')
  const svixTimestamp = event.req.headers.get('svix-timestamp')
  const svixSignature = event.req.headers.get('svix-signature')

  if (!body || !svixId || !svixTimestamp || !svixSignature) {
    log.error('Missing body or svix headers')
    throw new HTTPError({
      statusCode: 400,
      statusMessage: 'Missing body or signature headers',
    })
  }

  let clerkEvent: ClerkUserEvent
  try {
    const wh = new Webhook(webhookSecret)
    clerkEvent = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent
  } catch (err) {
    log.error({ err }, 'Signature verification failed')
    throw new HTTPError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  log.info(
    { type: clerkEvent.type, userId: clerkEvent.data.id },
    'Processing Clerk webhook',
  )

  switch (clerkEvent.type) {
    case 'user.created': {
      await handleUserCreated(clerkEvent)
      break
    }

    case 'user.deleted': {
      await handleUserDeleted(clerkEvent)
      break
    }

    default:
      log.info({ type: clerkEvent.type }, 'Unhandled Clerk event type')
  }

  return { received: true }
})

// --- user.created: Send welcome email ---

async function handleUserCreated(event: ClerkUserEvent) {
  const { id: userId, email_addresses, first_name } = event.data
  const primaryEmail = email_addresses[0]?.email_address

  if (!primaryEmail) {
    log.warn({ userId }, 'No email address on new user — skipping welcome email')
    return
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    log.warn('RESEND_API_KEY not configured — skipping welcome email')
    return
  }

  try {
    const resend = new Resend(resendApiKey)
    const name = escapeHtml(first_name || 'there')

    const { error } = await resend.emails.send({
      from: 'PreflightAPI <welcome@contact.preflightapi.io>',
      to: primaryEmail,
      subject: 'Welcome to PreflightAPI',
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 16px;">Welcome to PreflightAPI, ${name}!</h1>
  <p style="color: #475569; font-size: 16px; line-height: 1.6;">
    Thanks for signing up. You now have access to our free Student Pilot tier with 500 API calls per month.
  </p>
  <p style="color: #475569; font-size: 16px; line-height: 1.6;">
    Here's how to get started:
  </p>
  <ol style="color: #475569; font-size: 16px; line-height: 1.8;">
    <li>Head to your <a href="https://preflightapi.io/dashboard/getting-started" style="color: #2563eb;">Getting Started guide</a></li>
    <li>Grab your API key from the <a href="https://preflightapi.io/dashboard/keys" style="color: #2563eb;">API Keys page</a></li>
    <li>Check out our <a href="https://preflightapi.io/docs" style="color: #2563eb;">API documentation</a></li>
  </ol>
  <p style="color: #475569; font-size: 16px; line-height: 1.6;">
    Need more calls or access to premium endpoints? Check out our
    <a href="https://preflightapi.io/pricing" style="color: #2563eb;">pricing plans</a>.
  </p>
  <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-top: 32px;">
    Happy flying!<br />
    The PreflightAPI Team
  </p>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 16px;" />
  <p style="color: #94a3b8; font-size: 12px;">
    You're receiving this because you signed up for <a href="https://preflightapi.io" style="color: #94a3b8;">PreflightAPI</a>.
    If you have questions, reply to this email or contact
    <a href="mailto:support@preflightapi.io" style="color: #94a3b8;">support@preflightapi.io</a>.
  </p>
</div>
      `.trim(),
    })

    if (error) {
      log.error(
        { err: error, userId, email: primaryEmail },
        'Failed to send welcome email',
      )
    } else {
      log.info({ userId, email: primaryEmail }, 'Welcome email sent')
    }
  } catch (err) {
    // Non-fatal — don't block user creation over email failure
    log.error({ err, userId }, 'Error sending welcome email')
  }
}

// --- user.deleted: Cleanup Stripe customer and APIM user ---

async function handleUserDeleted(event: ClerkUserEvent) {
  const userId = event.data.id

  // 1. Delete the Stripe customer (triggers customer.deleted webhook → APIM downgrade)
  try {
    const { getStripe } = await import('@/lib/server/stripe-client')
    const stripe = getStripe()

    // Validate userId format before using in search query (defense-in-depth)
    if (!/^user_[\w]+$/.test(userId)) {
      log.error({ userId }, 'Invalid Clerk userId format — skipping Stripe cleanup')
      return
    }

    const customers = await stripe.customers.search({
      query: `metadata["clerkUserId"]:"${userId}"`,
      limit: 1,
    })

    const customer = customers.data[0]
    if (customer && !customer.deleted) {
      await stripe.customers.del(customer.id)
      log.info(
        { userId, customerId: customer.id },
        'Deleted Stripe customer for deleted Clerk user',
      )
    }
  } catch (err) {
    // Log but don't fail — Stripe customer may not exist
    log.error({ err, userId }, 'Error cleaning up Stripe customer')
  }

  // 2. Delete the APIM user
  try {
    const { apimFetch } = await import('@/lib/server/apim-client')

    // Delete subscriptions first, then the user
    const subs = await apimFetch<{ value: Array<{ name: string }> }>(
      `/users/${userId}/subscriptions`,
    )

    for (const sub of subs.value) {
      try {
        await apimFetch(`/subscriptions/${sub.name}`, {
          method: 'DELETE',
          headers: { 'If-Match': '*' },
        })
      } catch (err) {
        log.warn(
          { err, subscriptionName: sub.name },
          'Failed to delete APIM subscription',
        )
      }
    }

    await apimFetch(`/users/${userId}`, {
      method: 'DELETE',
      headers: { 'If-Match': '*' },
    })

    log.info({ userId }, 'Deleted APIM user and subscriptions')
  } catch (err) {
    // Log but don't fail — APIM user may not exist
    log.error({ err, userId }, 'Error cleaning up APIM user')
  }
}
