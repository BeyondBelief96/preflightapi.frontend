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
 * Moves a contact between the Paid and Free segments when their tier changes.
 * Requires the contact's Resend ID to manage segment membership.
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

    const segmentPaidId = env.RESEND_SEGMENT_PAID_ID
    const segmentFreeId = env.RESEND_SEGMENT_FREE_ID

    if (!segmentPaidId || !segmentFreeId) {
      log.warn(
        'RESEND_SEGMENT_PAID_ID or RESEND_SEGMENT_FREE_ID not configured — skipping segment update',
      )
      return
    }

    // Look up contact by email to get their ID
    const contact = await resend.contacts.get({ email })
    if (contact.error || !contact.data) {
      log.warn({ email }, 'Could not find Resend contact for segment update')
      return
    }

    const contactId = contact.data.id
    const isPaid = newTier !== 'student'

    // Add to the correct segment and remove from the other
    const addSegmentId = isPaid ? segmentPaidId : segmentFreeId
    const removeSegmentId = isPaid ? segmentFreeId : segmentPaidId

    const [addResult, removeResult] = await Promise.allSettled([
      resend.contacts.segments.add({ contactId, segmentId: addSegmentId }),
      resend.contacts.segments.remove({
        contactId,
        segmentId: removeSegmentId,
      }),
    ])

    if (addResult.status === 'rejected') {
      log.warn(
        { err: addResult.reason, email, segment: addSegmentId },
        'Failed to add contact to segment',
      )
    }
    if (removeResult.status === 'rejected') {
      log.warn(
        { err: removeResult.reason, email, segment: removeSegmentId },
        'Failed to remove contact from segment',
      )
    }

    log.info({ email, newTier }, 'Updated Resend contact tier segment')
  } catch (err) {
    log.error({ err, email }, 'Error updating Resend contact tier segment')
  }
}
