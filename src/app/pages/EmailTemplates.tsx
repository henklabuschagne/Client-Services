import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Mail, Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import type { EmailTemplate } from '../lib/appStore';

interface EmailTemplatesProps {
  onSelectTemplate?: (template: EmailTemplate) => void;
  mode?: 'standalone' | 'selector';
}

export const EmailTemplates = ({ onSelectTemplate, mode = 'standalone' }: EmailTemplatesProps) => {
  const { emailTemplates, storeActions } = useAppStore('emailTemplates');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    category: 'general' as EmailTemplate['category'],
  });

  const handleCreateTemplate = async () => {
    setSaving(true);
    const result = await storeActions.createEmailTemplate(formData);
    setSaving(false);
    if (result.success) {
      toast.success('Template created!');
      setIsCreateDialogOpen(false);
      resetForm();
    } else {
      toast.error(result.error.message);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    setSaving(true);
    const result = await storeActions.updateEmailTemplate(editingTemplate.id, formData);
    setSaving(false);
    if (result.success) {
      toast.success('Template updated!');
      setEditingTemplate(null);
      resetForm();
    } else {
      toast.error(result.error.message);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const result = await storeActions.deleteEmailTemplate(id);
      if (result.success) {
        toast.success('Template deleted');
      } else {
        toast.error(result.error.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', subject: '', body: '', category: 'general' });
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({ name: template.name, subject: template.subject, body: template.body, category: template.category });
  };

  const getCategoryColor = (category: EmailTemplate['category']) => {
    const colors = {
      'follow-up': 'bg-brand-primary-light text-brand-primary',
      'introduction': 'bg-brand-success-light text-brand-success',
      'proposal': 'bg-brand-secondary-light text-brand-main',
      'meeting': 'bg-brand-warning-light text-brand-warning',
      'closing': 'bg-brand-error-light text-brand-error',
      'general': 'bg-muted text-muted-foreground',
    };
    return colors[category];
  };

  if (mode === 'selector') {
    return (
      <div className="space-y-3">
        {emailTemplates.map(template => (
          <Card 
            key={template.id} 
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => onSelectTemplate?.(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">Subject: {template.subject}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 line-clamp-2">{template.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Email Templates</h1>
          <p className="text-muted-foreground mt-1">Pre-built templates with variable substitution</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Follow-up After Demo" />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <select id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as EmailTemplate['category'] })} className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="general">General</option>
                  <option value="introduction">Introduction</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="proposal">Proposal</option>
                  <option value="meeting">Meeting</option>
                  <option value="closing">Closing</option>
                </select>
              </div>
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input id="subject" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Use {{name}}, {{company}}, {{email}}, {{phone}}" />
              </div>
              <div>
                <Label htmlFor="body">Email Body</Label>
                <Textarea id="body" value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })} placeholder="Use {{name}}, {{company}}, {{email}}, {{phone}} as variables" rows={12} />
              </div>
              <div className="bg-brand-primary-light p-3 rounded-md">
                <p className="text-sm text-brand-main">Available Variables:</p>
                <p className="text-xs text-brand-primary mt-1">{'{{name}}'}, {'{{company}}'}, {'{{email}}'}, {'{{phone}}'}</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); setEditingTemplate(null); resetForm(); }}>Cancel</Button>
                <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} disabled={!formData.name || !formData.subject || !formData.body || saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {emailTemplates.map(template => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Subject: {template.subject}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { openEditDialog(template); setIsCreateDialogOpen(true); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{template.body}</pre>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};