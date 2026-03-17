import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import type { Contact } from '../lib/appStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
}

export const EditContactDialog = ({ open, onOpenChange, contact }: EditContactDialogProps) => {
  const { storeActions } = useAppStore('contacts');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: contact.name,
    email: contact.email,
    company: contact.company,
    phone: contact.phone,
    status: contact.status,
    tags: contact.tags.join(', '),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await storeActions.updateContact(contact.id, {
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
    });
    setSaving(false);

    if (result.success) {
      toast.success('Contact updated!');
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
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>Update contact information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input id="edit-name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input id="edit-email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company *</Label>
              <Input id="edit-company" value={formData.company} onChange={(e) => handleChange('company', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input id="edit-phone" type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="won">Won</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input id="edit-tags" placeholder="e.g., enterprise, high-priority" value={formData.tags} onChange={(e) => handleChange('tags', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
