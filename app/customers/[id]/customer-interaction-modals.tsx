"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CustomerInteractionModals({ customer, customerId }: { customer: any; customerId: string }) {
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [isSendOpen, setIsSendOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [interactionForm, setInteractionForm] = useState({
    interactionType: "",
    subject: "",
    summary: "",
    followUpRequired: "no",
  })

  const [commForm, setCommForm] = useState({
    commType: "",
    message: "",
  })

  const handleLogInteraction = async () => {
    if (!interactionForm.interactionType || !interactionForm.subject || !interactionForm.summary) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/customers/${customerId}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interactionType: interactionForm.interactionType,
          subject: interactionForm.subject,
          summary: interactionForm.summary,
          followUpRequired: interactionForm.followUpRequired,
          agentId: 1,
        }),
      })

      if (response.ok) {
        alert("Interaction logged successfully!")
        setIsLogOpen(false)
        setInteractionForm({ interactionType: "", subject: "", summary: "", followUpRequired: "no" })
        window.location.reload()
      } else {
        alert("Failed to log interaction")
      }
    } catch (error) {
      alert("Error logging interaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendCommunication = async () => {
    if (!commForm.commType || !commForm.message) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      if (commForm.commType === "whatsapp") {
        const phoneNumber = customer.phone?.replace(/[^0-9]/g, "")
        const message = encodeURIComponent(commForm.message)
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank")
        alert("WhatsApp opened! Message ready to send.")
      } else {
        alert(`${commForm.commType.toUpperCase()} integration coming soon!\n\nMessage preview:\n${commForm.message}`)
      }

      setIsSendOpen(false)
      setCommForm({ commType: "", message: "" })
    } catch (error) {
      alert("Error sending communication")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            Log Interaction
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Customer Interaction</DialogTitle>
            <DialogDescription>Record a new interaction with {customer.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Interaction Type *</Label>
              <Select
                value={interactionForm.interactionType}
                onValueChange={(value) => setInteractionForm({ ...interactionForm, interactionType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="chat">Live Chat</SelectItem>
                  <SelectItem value="visit">Office Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Subject *</Label>
              <Input
                placeholder="Brief subject of interaction"
                value={interactionForm.subject}
                onChange={(e) => setInteractionForm({ ...interactionForm, subject: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Interaction Summary *</Label>
              <Textarea
                placeholder="Detailed summary of the interaction..."
                rows={3}
                value={interactionForm.summary}
                onChange={(e) => setInteractionForm({ ...interactionForm, summary: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Follow-up Required?</Label>
              <Select
                value={interactionForm.followUpRequired}
                onValueChange={(value) => setInteractionForm({ ...interactionForm, followUpRequired: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleLogInteraction} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Interaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            Send Communication
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Communication</DialogTitle>
            <DialogDescription>Send a message to {customer.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Communication Type *</Label>
              <Select
                value={commForm.commType}
                onValueChange={(value) => setCommForm({ ...commForm, commType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp (Working)</SelectItem>
                  <SelectItem value="email">Email (Coming Soon)</SelectItem>
                  <SelectItem value="sms">SMS (Coming Soon)</SelectItem>
                  <SelectItem value="letter">Letter (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Message Template</Label>
              <Select
                onValueChange={(value) => {
                  if (value === "renewal") {
                    setCommForm({
                      ...commForm,
                      message: `Hi ${customer.name}, your policy is due for renewal. Please contact us to continue your coverage.`,
                    })
                  } else if (value === "claim-update") {
                    setCommForm({
                      ...commForm,
                      message: `Hi ${customer.name}, we have an update on your claim. Please call us for details.`,
                    })
                  } else if (value === "payment") {
                    setCommForm({
                      ...commForm,
                      message: `Hi ${customer.name}, this is a reminder about your upcoming premium payment.`,
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="renewal">Policy Renewal Reminder</SelectItem>
                  <SelectItem value="claim-update">Claim Status Update</SelectItem>
                  <SelectItem value="payment">Payment Reminder</SelectItem>
                  <SelectItem value="custom">Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Message *</Label>
              <Textarea
                placeholder="Type your message here..."
                rows={4}
                value={commForm.message}
                onChange={(e) => setCommForm({ ...commForm, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSendCommunication} disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
