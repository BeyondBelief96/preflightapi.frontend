import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react'
import { useState } from 'react'
import { createPageHead } from '@/lib/seo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SITE_CONFIG } from '@/lib/constants'
import { sendContactEmail } from '@/lib/server/contact'

export const Route = createFileRoute('/_marketing/contact')({
  head: () =>
    createPageHead({
      title: 'Contact',
      description:
        'Get in touch with the PreflightAPI team. Questions about our API, plans, or custom integrations? We are here to help.',
      path: '/contact',
    }),
  component: ContactPage,
})

function ContactPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    try {
      await sendContactEmail({
        data: { firstName, lastName, email, subject, message },
      })
      setStatus('success')
      setFirstName('')
      setLastName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Contact form */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Get in Touch</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have a question about PreflightAPI? Interested in upgrading your
              plan? Fill out the form and we will get back to you as soon as
              possible.
            </p>

            {status === 'success' ? (
              <div className="mt-8 flex items-start gap-3 rounded-xl border border-aviation-success/30 bg-aviation-success/10 p-6">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-aviation-success" />
                <div>
                  <p className="font-medium">Message sent!</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Thanks for reaching out. We will get back to you soon.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setStatus('idle')}
                  >
                    Send another message
                  </Button>
                </div>
              </div>
            ) : (
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={subject} onValueChange={setSubject} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="technical">
                        Technical Support
                      </SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="enterprise">
                        Enterprise / Custom Plan
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us about your project or question..."
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {status === 'error' && (
                  <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p>
                      {errorMsg || 'Failed to send message. Please try again.'}
                    </p>
                  </div>
                )}

                <Button type="submit" size="lg" disabled={status === 'sending'}>
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <div className="lg:pt-12">
            <div className="rounded-xl border bg-muted/30 p-8">
              <h2 className="text-xl font-semibold">Other Ways to Reach Us</h2>
              <div className="mt-6 space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="mt-1 h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a
                      href={`mailto:${SITE_CONFIG.supportEmail}`}
                      className="text-sm text-muted-foreground hover:text-accent"
                    >
                      {SITE_CONFIG.supportEmail}
                    </a>
                  </div>
                </div>
              </div>
              <div className="mt-8 border-t pt-8">
                <h3 className="font-medium">Response Time</h3>
                <p className="mt-3 text-sm text-muted-foreground">
                  We typically respond within 1-2 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
