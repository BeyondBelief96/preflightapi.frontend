import { HTTPError, defineHandler } from 'h3'
import { Webhook } from 'svix'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { WelcomeEmail } from '@/emails/welcome'
import { createLogger } from '@/lib/server/logger'

const log = createLogger('clerk-webhook')

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
    log.warn(
      { userId },
      'No email address on new user — skipping welcome email',
    )
    return
  }

  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    log.warn('RESEND_API_KEY not configured — skipping welcome email')
    return
  }

  try {
    const resend = new Resend(resendApiKey)
    const name = first_name || 'there'
    const html = await render(WelcomeEmail({ name }))

    const { error } = await resend.emails.send({
      from: 'Brandon at PreflightAPI <welcome@contact.preflightapi.io>',
      to: primaryEmail,
      subject: 'Welcome to PreflightAPI',
      html,
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

  // Add user as a Resend contact (non-fatal)
  try {
    const { createResendContact } = await import('@/lib/server/email/contacts')
    await createResendContact(
      primaryEmail,
      first_name,
      event.data.last_name,
      'student',
    )
  } catch (err) {
    log.error({ err, userId }, 'Error creating Resend contact')
  }
}

// --- user.deleted: Cleanup Stripe customer and APIM user ---

async function handleUserDeleted(event: ClerkUserEvent) {
  const userId = event.data.id

  // 1. Delete the Stripe customer (triggers customer.deleted webhook → APIM downgrade)
  try {
    const { getStripe } = await import('@/lib/server/stripe/client')
    const stripe = getStripe()

    // Validate userId format before using in search query (defense-in-depth)
    if (!/^user_[\w]+$/.test(userId)) {
      log.error(
        { userId },
        'Invalid Clerk userId format — skipping Stripe cleanup',
      )
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
    const { apimFetch } = await import('@/lib/server/apim/client')

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

  // 3. Remove from Resend contacts
  const primaryEmail = event.data.email_addresses[0]?.email_address
  if (primaryEmail) {
    try {
      const { removeResendContact } =
        await import('@/lib/server/email/contacts')
      await removeResendContact(primaryEmail)
    } catch (err) {
      log.error({ err, userId }, 'Error removing Resend contact')
    }
  }
}
