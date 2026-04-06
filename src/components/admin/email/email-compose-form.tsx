import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { TipTapEditor } from './tiptap-editor'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getResendSegments,
  getResendTopics,
  sendBroadcast,
} from '@/lib/server/admin/email'
import { adminKeys } from '@/lib/server/queries'

export function EmailComposeForm() {
  const queryClient = useQueryClient()
  const [segmentId, setSegmentId] = useState('')
  const [topicId, setTopicId] = useState('')
  const [subject, setSubject] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: segments, isLoading: segmentsLoading } = useQuery({
    queryKey: adminKeys.segments(),
    queryFn: () => getResendSegments(),
    staleTime: 5 * 60_000,
  })

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: adminKeys.topics(),
    queryFn: () => getResendTopics(),
    staleTime: 5 * 60_000,
  })

  const broadcastMutation = useMutation({
    mutationFn: (input: Parameters<typeof sendBroadcast>[0]['data']) =>
      sendBroadcast({ data: input }),
    onSuccess: () => {
      toast.success('Broadcast sent successfully')
      queryClient.invalidateQueries({ queryKey: adminKeys.broadcastHistory() })
      setSegmentId('')
      setTopicId('')
      setSubject('')
      setHtmlContent('')
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : 'Failed to send broadcast',
      )
    },
  })

  const selectedSegment = segments?.find((s) => s.id === segmentId)
  const selectedTopic = topics?.find((t) => t.id === topicId)

  const canSend =
    segmentId &&
    subject.trim() &&
    htmlContent.trim() &&
    !broadcastMutation.isPending

  const handleSend = () => {
    broadcastMutation.mutate({
      segmentId,
      topicId: topicId || undefined,
      subject,
      htmlContent,
    })
    setConfirmOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Compose Broadcast
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Segment */}
          <div className="space-y-2">
            <Label>Segment</Label>
            {segmentsLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select value={segmentId} onValueChange={setSegmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a segment..." />
                </SelectTrigger>
                <SelectContent>
                  {segments?.map((segment) => (
                    <SelectItem key={segment.id} value={segment.id}>
                      {segment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label>Topic (optional)</Label>
            {topicsLoading ? (
              <Skeleton className="h-9 w-full" />
            ) : (
              <Select value={topicId} onValueChange={setTopicId}>
                <SelectTrigger>
                  <SelectValue placeholder="No topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics?.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

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
              {broadcastMutation.isPending ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl md:left-[calc(50%+8rem)]">
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
                className="h-[250px] w-full rounded-md sm:h-[400px]"
                sandbox=""
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-lg md:left-[calc(50%+8rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Broadcast</AlertDialogTitle>
            <AlertDialogDescription>
              Send &quot;{subject}&quot; to the{' '}
              <strong>{selectedSegment?.name ?? 'selected'}</strong> segment
              {selectedTopic ? ` under the "${selectedTopic.name}" topic` : ''}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              Send Broadcast
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
