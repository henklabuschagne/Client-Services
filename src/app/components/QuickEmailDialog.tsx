import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Send, FileText } from 'lucide-react';
import type { Contact } from '../lib/appStore';
import type { EmailTemplate } from '../lib/appStore';
import { EmailTemplates } from '../pages/EmailTemplates';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface QuickEmailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  onEmailSent: (subject: string, body: string) => void;
}

export const QuickEmailDialog = ({ isOpen, onOpenChange, contact, onEmailSent }: QuickEmailDialogProps) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const substituteVariables = (text: string): string => {
    return text
      .replace(/\{\{name\}\}/g, contact.name)
      .replace(/\{\{company\}\}/g, contact.company)
      .replace(/\{\{email\}\}/g, contact.email)
      .replace(/\{\{phone\}\}/g, contact.phone);
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSubject(substituteVariables(template.subject));
    setBody(substituteVariables(template.body));
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Please fill in both subject and body');
      return;
    }

    toast.success(`Email sent to ${contact.name}!`);
    onEmailSent(subject, body);
    setSubject('');
    setBody('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Email to {contact.name}</DialogTitle>
          <p className="text-sm text-gray-500">{contact.email} • {contact.company}</p>
        </DialogHeader>

        <Tabs defaultValue="compose" className="mt-4">
          <TabsList>
            <TabsTrigger value="compose">
              <Send className="w-4 h-4 mr-2" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-2" />
              Use Template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-4">
            <div>
              <Label htmlFor="to">To</Label>
              <Input id="to" value={`${contact.name} <${contact.email}>`} disabled className="bg-gray-50" />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Enter email subject" />
            </div>
            <div>
              <Label htmlFor="body">Message</Label>
              <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Enter your message" rows={15} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSend}>
                <Send className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="bg-brand-primary-light p-3 rounded-md mb-4">
              <p className="text-sm text-brand-main">
                Click a template to use it. Variables will be automatically filled with contact information.
              </p>
            </div>
            <EmailTemplates mode="selector" onSelectTemplate={handleSelectTemplate} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};