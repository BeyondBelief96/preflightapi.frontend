import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  RecipientSelector
  
} from './recipient-selector'
import { TipTapEditor } from './tiptap-editor'
import type {SelectedRecipient} from './recipient-selector';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { sendAdminEmail } from '@/lib/server/admin-email'
import { adminKeys } from '@/lib/server/apim-queries'

export function EmailComposeForm() {
  const queryClient = useQueryClient()
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [recipients, setRecipients] = useState<Array<SelectedRecipient>>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const sendMutation = useMutation({
    mutationFn: (input: Parameters<typeof sendAdminEmail>[0]['data']) =>
      sendAdminEmail({ data: input }),
    onSuccess: (result) => {
      if (result.failed > 0) {
        toast.warning(
          `Sent to ${result.sent} recipients, ${result.failed} failed`,
        )
      } else {
        toast.success(`Email sent to ${result.sent} recipients`)
      }
      queryClient.invalidateQueries({ queryKey: adminKeys.emailHistory() })
      // Reset form
      setSubject('')
      setHtmlContent('')
      setRecipients([])
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to send email')
    },
  })

  const canSend =
    subject.trim() &&
    htmlContent.trim() &&
    recipients.length > 0 &&
    !sendMutation.isPending

  const handleSend = () => {
    sendMutation.mutate({
      subject,
      htmlContent,
      recipients: recipients.map((r) => ({
        email: r.email,
        name: r.name,
      })),
    })
    setConfirmOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Compose Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label>Recipients</Label>
            <RecipientSelector value={recipients} onChange={setRecipients} />
          </div>

          {/* Editor */}
          <div className="space-y-2">
            <Label>Body</Label>
            <TipTapEditor onUpdate={setHtmlContent} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              disabled={!htmlContent.trim()}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={!canSend}
            >
              <Send className="mr-2 h-4 w-4" />
              {sendMutation.isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl md:left-[calc(50%+8rem)]">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm">
              <span className="font-medium text-muted-foreground">
                Subject:{' '}
              </span>
              {subject || '(no subject)'}
            </p>
            <div className="rounded-md border">
              <iframe
                srcDoc={`
                  <html>
                    <head>
                      <style>
                        body {
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          padding: 24px;
                          color: #475569;
                          background-color: #ffffff;
                          font-size: 16px;
                          line-height: 1.6;
                          max-width: 600px;
                          margin: 0 auto;
                        }
                      </style>
                    </head>
                    <body>${htmlContent}</body>
                  </html>
                `}
                title="Email preview"
                className="h-[400px] w-full rounded-md"
                sandbox=""
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="md:left-[calc(50%+8rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Email</AlertDialogTitle>
            <AlertDialogDescription>
              Send &quot;{subject}&quot; to {recipients.length} recipient
              {recipients.length !== 1 ? 's' : ''}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
