import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId?: string;
}

export const AddDealDialog = ({ open, onOpenChange, contactId }: AddDealDialogProps) => {
  const { contacts, storeActions } = useAppStore('contacts', 'deals');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    contactId: contactId || '',
    title: '',
    value: '',
    stage: 'prospecting' as 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost',
    probability: '50',
    expectedCloseDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await storeActions.createDeal({
      contactId: formData.contactId,
      title: formData.title,
      value: parseFloat(formData.value),
      stage: formData.stage,
      probability: parseInt(formData.probability),
      expectedCloseDate: new Date(formData.expectedCloseDate).toISOString(),
    });
    setSaving(false);

    if (result.success) {
      toast.success('Deal added!');
      setFormData({ contactId: contactId || '', title: '', value: '', stage: 'prospecting', probability: '50', expectedCloseDate: '' });
      onOpenChange(false);
    } else {
      toast.error(result.error.message);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Deal</DialogTitle>
          <DialogDescription>Create a new deal in your pipeline</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deal-contact">Contact *</Label>
              <Select value={formData.contactId} onValueChange={(value) => handleChange('contactId', value)} disabled={!!contactId}>
                <SelectTrigger><SelectValue placeholder="Select a contact" /></SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>{contact.name} - {contact.company}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-title">Deal Title *</Label>
              <Input id="deal-title" placeholder="e.g., Enterprise Package Deal" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-value">Deal Value (ZAR) *</Label>
              <Input id="deal-value" type="number" min="0" step="1" placeholder="900000" value={formData.value} onChange={(e) => handleChange('value', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-stage">Stage</Label>
              <Select value={formData.stage} onValueChange={(value) => handleChange('stage', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospecting">Prospecting</SelectItem>
                  <SelectItem value="qualification">Qualification</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed-won">Closed Won</SelectItem>
                  <SelectItem value="closed-lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-probability">Probability (%) *</Label>
              <Input id="deal-probability" type="number" min="0" max="100" value={formData.probability} onChange={(e) => handleChange('probability', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deal-closedate">Expected Close Date *</Label>
              <Input id="deal-closedate" type="date" value={formData.expectedCloseDate} onChange={(e) => handleChange('expectedCloseDate', e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Deal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};