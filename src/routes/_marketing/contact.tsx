import { createFileRoute } from '@tanstack/react-router'
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
import { Mail } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/constants'

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
  return (
    <div className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          {/* Contact form */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Get in Touch</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have a question about PreflightAPI? Interested in upgrading your
              plan? Fill out the form and we will get back to you within one
              business day.
            </p>
            <form className="mt-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="professional">Professional Plan</SelectItem>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your project or question..."
                  rows={5}
                />
              </div>
              <Button type="submit" size="lg">
                Send Message
              </Button>
            </form>
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
                <h3 className="font-medium">Response Times</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>Student Pilot: Community support</li>
                  <li>Private Pilot: 1-2 business days</li>
                  <li>Commercial Pilot: Within 24 hours</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
