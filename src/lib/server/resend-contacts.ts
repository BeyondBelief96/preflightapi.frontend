import { createLogger } from './logger'
import { env } from '@/env'

const log = createLogger('resend-contacts')

/**
 * Creates a Resend contact, adds them to the appropriate segments,
 * and opts them into all topics.
 *
 * Non-fatal — logs errors but never throws.
 */
export async function createResendContact(
  email: string,
  firstName: string | null,
  lastName: string | null,
  tier: 'student' | 'private' | 'commercial' | 'atp',
): Promise<void> {
  try {
    const { getResend } = await import('./resend-client')
    const resend = getResend()

    const segmentAllId = env.RESEND_SEGMENT_ALL_ID
    const segmentPaidId = env.RESEND_SEGMENT_PAID_ID
    const segmentFreeId = env.RESEND_SEGMENT_FREE_ID
    const topicAnnouncementsId = env.RESEND_TOPIC_ANNOUNCEMENTS_ID
    const topicReleasesId = env.RESEND_TOPIC_RELEASES_ID
    const topicAlertsId = env.RESEND_TOPIC_ALERTS_ID

    if (!segmentAllId) {
      log.warn('RESEND_SEGMENT_ALL_ID not configured — skipping contact create')
      return
    }

    // Build segments list
    const segments: Array<{ id: string }> = [{ id: segmentAllId }]
    const tierSegmentId = tier === 'student' ? segmentFreeId : segmentPaidId
    if (tierSegmentId) {
      segments.push({ id: tierSegmentId })
    }

    // Build topics list (opt into all configured topics)
    const topics: Array<{ id: string; subscription: 'opt_in' | 'opt_out' }> = []
    if (topicAnnouncementsId)
      topics.push({ id: topicAnnouncementsId, subscription: 'opt_in' })
    if (topicReleasesId)
      topics.push({ id: topicReleasesId, subscription: 'opt_in' })
    if (topicAlertsId)
      topics.push({ id: topicAlertsId, subscription: 'opt_in' })

    const { error } = await resend.contacts.create({
      email,
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      segments,
      topics,
    })

    if (error) {
      log.error({ err: error, email }, 'Failed to create Resend contact')
    } else {
      log.info({ email, tier }, 'Created Resend contact')
    }
  } catch (err) {
    log.error({ err, email }, 'Error creating Resend contact')
  }
}

/**
 * Removes a Resend contact by email.
 *
 * Non-fatal — logs errors but never throws.
 */
export async function removeResendContact(email: string): Promise<void> {
  try {
    const { getResend } = await import('./resend-client')
    const resend = getResend()

    const { error } = await resend.contacts.remove({ email })

    if (error) {
      log.error({ err: error, email }, 'Failed to remove Resend contact')
    } else {
      log.info({ email }, 'Removed Resend contact')
    }
  } catch (err) {
    log.error({ err, email }, 'Error removing Resend contact')
  }
}

/**
 * Updates a contact's tier segment by upserting via `contacts.create()`.
 * Resend's create is idempotent — if the contact exists it updates them,
 * if not it creates them. This eliminates any race condition with the
 * Clerk webhook that initially creates the contact.
 *
 * Non-fatal — logs errors but never throws.
 */
export async function updateContactTierSegment(
  email: string,
  newTier: 'student' | 'private' | 'commercial' | 'atp',
): Promise<void> {
  try {
    const { getResend } = await import('./resend-client')
    const resend = getResend()

    const segmentAllId = env.RESEND_SEGMENT_ALL_ID
    const segmentPaidId = env.RESEND_SEGMENT_PAID_ID
    const segmentFreeId = env.RESEND_SEGMENT_FREE_ID

    if (!segmentAllId || !segmentPaidId || !segmentFreeId) {
      log.warn(
        'Resend segment IDs not fully configured — skipping segment update',
      )
      return
    }

    const isPaid = newTier !== 'student'

    // Upsert contact with the correct segment — creates if missing, updates if exists
    const { error } = await resend.contacts.create({
      email,
      segments: [
        { id: segmentAllId },
        { id: isPaid ? segmentPaidId : segmentFreeId },
      ],
    })

    if (error) {
      log.warn({ err: error, email }, 'Failed to upsert Resend contact segment')
      return
    }

    // Remove from the opposite segment (create doesn't remove old segments)
    const removeSegmentId = isPaid ? segmentFreeId : segmentPaidId
    const contact = await resend.contacts.get({ email })
    if (contact.data) {
      await resend.contacts.segments
        .remove({ contactId: contact.data.id, segmentId: removeSegmentId })
        .catch(() => {
          // Ignore — contact may not have been in this segment
        })
    }

    log.info({ email, newTier }, 'Updated Resend contact tier segment')
  } catch (err) {
    log.error({ err, email }, 'Error updating Resend contact tier segment')
  }
}
