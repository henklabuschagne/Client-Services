import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
}

export const AddNoteDialog = ({ open, onOpenChange, contactId }: AddNoteDialogProps) => {
  const { storeActions } = useAppStore('notes');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await storeActions.createNote({ contactId, content });
    setSaving(false);

    if (result.success) {
      toast.success('Note added!');
      setContent('');
      onOpenChange(false);
    } else {
      toast.error(result.error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>Add a note about this contact</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="content">Note *</Label>
              <Textarea id="content" placeholder="Write your note here..." value={content} onChange={(e) => setContent(e.target.value)} required rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
