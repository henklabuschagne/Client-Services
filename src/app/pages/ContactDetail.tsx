import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAppStore } from '../hooks/useAppStore';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  Plus,
  CheckCircle2,
  Trash2,
  Edit,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Send,
  Loader2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AddActionDialog } from '../components/AddActionDialog';
import { AddNoteDialog } from '../components/AddNoteDialog';
import { EditContactDialog } from '../components/EditContactDialog';
import { AddDealDialog } from '../components/AddDealDialog';
import { QuickEmailDialog } from '../components/QuickEmailDialog';
import { toast } from 'sonner';

export const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { contacts, actions, notes, deals, storeActions } = useAppStore('contacts', 'actions', 'notes', 'deals');
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const contact = contacts.find(c => c.id === id);
  const contactActions = actions
    .filter(a => a.contactId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const contactNotes = notes
    .filter(n => n.contactId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const contactDeals = deals
    .filter(d => d.contactId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!contact) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">Contact not found</p>
          <Button onClick={() => navigate('/contacts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contacts
          </Button>
        </div>
      </div>
    );
  }

  const activeActions = contactActions.filter(a => !a.completed);
  const completedActions = contactActions.filter(a => a.completed);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-brand-primary-light text-brand-primary';
      case 'active': return 'bg-brand-success-light text-brand-success';
      case 'won': return 'bg-brand-secondary-light text-brand-main';
      case 'lost': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'prospecting': return 'bg-muted text-muted-foreground';
      case 'qualification': return 'bg-brand-primary-light text-brand-primary';
      case 'proposal': return 'bg-brand-warning-light text-brand-warning';
      case 'negotiation': return 'bg-brand-error-light text-brand-error';
      case 'closed-won': return 'bg-brand-success-light text-brand-success';
      case 'closed-lost': return 'bg-brand-error-light text-brand-error';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleDeleteContact = async () => {
    if (confirm(`Are you sure you want to delete ${contact.name}? This will also delete all associated actions, notes, and deals.`)) {
      setDeleting(true);
      const result = await storeActions.deleteContact(contact.id);
      setDeleting(false);
      if (result.success) {
        toast.success('Contact deleted');
        navigate('/contacts');
      } else {
        toast.error(result.error.message);
      }
    }
  };

  const handleCompleteAction = async (actionId: string) => {
    setLoadingIds(prev => new Set(prev).add(actionId));
    const result = await storeActions.completeAction(actionId);
    setLoadingIds(prev => { const next = new Set(prev); next.delete(actionId); return next; });
    if (result.success) {
      toast.success('Action completed!');
    } else {
      toast.error(result.error.message);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    setLoadingIds(prev => new Set(prev).add(`del-${actionId}`));
    const result = await storeActions.deleteAction(actionId);
    setLoadingIds(prev => { const next = new Set(prev); next.delete(`del-${actionId}`); return next; });
    if (!result.success) toast.error(result.error.message);
  };

  const handleDeleteNote = async (noteId: string) => {
    setLoadingIds(prev => new Set(prev).add(`note-${noteId}`));
    const result = await storeActions.deleteNote(noteId);
    setLoadingIds(prev => { const next = new Set(prev); next.delete(`note-${noteId}`); return next; });
    if (!result.success) toast.error(result.error.message);
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      setLoadingIds(prev => new Set(prev).add(`deal-${dealId}`));
      const result = await storeActions.deleteDeal(dealId);
      setLoadingIds(prev => { const next = new Set(prev); next.delete(`deal-${dealId}`); return next; });
      if (!result.success) toast.error(result.error.message);
    }
  };

  const handleEmailSent = async (subject: string, body: string) => {
    await storeActions.createAction({
      contactId: contact.id,
      type: 'email',
      description: `Sent: ${subject}`,
      dueDate: new Date().toISOString(),
      completed: true,
    });
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/contacts')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contacts
        </Button>

        {/* Contact Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl">{contact.name}</CardTitle>
                  <Badge className={getStatusColor(contact.status)}>
                    {contact.status}
                  </Badge>
                </div>
                <CardDescription className="text-base flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  {contact.company}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEmailDialogOpen(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeleteContact} disabled={deleting}>
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-foreground/80">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <a href={`mailto:${contact.email}`} className="hover:underline">
                    {contact.email}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <a href={`tel:${contact.phone}`} className="hover:underline">
                    {contact.phone}
                  </a>
                </div>
              </div>
            </div>

            {contact.tags.length > 0 && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {contact.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="actions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="actions">Actions ({activeActions.length})</TabsTrigger>
            <TabsTrigger value="history">History ({completedActions.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes ({contactNotes.length})</TabsTrigger>
            <TabsTrigger value="deals">Deals ({contactDeals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="actions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Next Actions</CardTitle>
                    <CardDescription>Pending actions for this contact</CardDescription>
                  </div>
                  <Button onClick={() => setIsActionDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Action
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeActions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="mb-4">No pending actions</p>
                    <Button onClick={() => setIsActionDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Next Action
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeActions.map((action) => (
                      <div key={action.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3 flex-1">
                          <Button
                            variant="outline"
                            size="icon"
                            disabled={loadingIds.has(action.id)}
                            onClick={() => handleCompleteAction(action.id)}
                          >
                            {loadingIds.has(action.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </Button>
                          <div>
                            <Badge variant="outline" className="mb-1">{action.type}</Badge>
                            <p className="font-medium">{action.description}</p>
                            <p className="text-sm text-gray-500">
                              Due: {action.dueDate ? format(parseISO(action.dueDate), 'MMM d, yyyy h:mm a') : 'No date'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={loadingIds.has(`del-${action.id}`)}
                          onClick={() => handleDeleteAction(action.id)}
                        >
                          {loadingIds.has(`del-${action.id}`) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>Completed actions</CardDescription>
              </CardHeader>
              <CardContent>
                {completedActions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No completed actions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedActions.map((action) => (
                      <div key={action.id} className="flex items-start gap-3 p-4 border rounded-lg bg-gray-50">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-1">{action.type}</Badge>
                          <p className="font-medium text-gray-700">{action.description}</p>
                          <p className="text-sm text-gray-500">
                            Completed: {action.completedAt && format(parseISO(action.completedAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Notes</CardTitle>
                    <CardDescription>Keep track of important details</CardDescription>
                  </div>
                  <Button onClick={() => setIsNoteDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contactNotes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="mb-4">No notes yet</p>
                    <Button onClick={() => setIsNoteDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contactNotes.map((note) => (
                      <div key={note.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-gray-700 mb-2">{note.content}</p>
                            <p className="text-sm text-gray-500">
                              {format(parseISO(note.createdAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={loadingIds.has(`note-${note.id}`)}
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            {loadingIds.has(`note-${note.id}`) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deals">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Deals</CardTitle>
                    <CardDescription>Manage deals associated with this contact</CardDescription>
                  </div>
                  <Button onClick={() => setIsDealDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Deal
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contactDeals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="mb-4">No deals yet</p>
                    <Button onClick={() => setIsDealDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Deal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contactDeals.map((deal) => (
                      <div key={deal.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium">{deal.title}</p>
                              <Badge className={getStageColor(deal.stage)}>{deal.stage}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-semibold text-green-600">R{deal.value.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>{deal.probability}% probability</span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              Expected close: {format(parseISO(deal.expectedCloseDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={loadingIds.has(`deal-${deal.id}`)}
                            onClick={() => handleDeleteDeal(deal.id)}
                          >
                            {loadingIds.has(`deal-${deal.id}`) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AddActionDialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen} contactId={contact.id} />
      <AddNoteDialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen} contactId={contact.id} />
      <EditContactDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} contact={contact} />
      <AddDealDialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen} contactId={contact.id} />
      <QuickEmailDialog isOpen={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen} contact={contact} onEmailSent={handleEmailSent} />
    </div>
  );
};