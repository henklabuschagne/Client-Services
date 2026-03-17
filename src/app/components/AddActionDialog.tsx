import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
}

export const AddActionDialog = ({ open, onOpenChange, contactId }: AddActionDialogProps) => {
  const { storeActions } = useAppStore('actions');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: 'call' as 'call' | 'email' | 'meeting' | 'task' | 'follow-up',
    description: '',
    dueDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await storeActions.createAction({
      contactId,
      type: formData.type,
      description: formData.description,
      dueDate: new Date(formData.dueDate).toISOString(),
      completed: false,
    });
    setSaving(false);

    if (result.success) {
      toast.success('Action added!');
      setFormData({ type: 'call', description: '', dueDate: '' });
      onOpenChange(false);
    } else {
      toast.error(result.error.message);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Next Action</DialogTitle>
          <DialogDescription>Set a next action to follow up with this contact</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Action Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" placeholder="What needs to be done?" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} required rows={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date & Time *</Label>
              <Input id="dueDate" type="datetime-local" value={formData.dueDate} onChange={(e) => handleChange('dueDate', e.target.value)} min={today} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Action
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
