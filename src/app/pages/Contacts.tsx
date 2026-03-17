import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { useNavigate } from 'react-router';
import { Plus, Search, User, Building, Mail, Phone } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AddContactDialog } from '../components/AddContactDialog';

export const Contacts = () => {
  const { contacts, actions } = useAppStore('contacts', 'actions');
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const getNextActionForContact = (contactId: string) => {
    const contactActions = actions
      .filter(a => a.contactId === contactId && !a.completed)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return contactActions[0];
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: contacts.length,
    lead: contacts.filter(c => c.status === 'lead').length,
    active: contacts.filter(c => c.status === 'active').length,
    won: contacts.filter(c => c.status === 'won').length,
    lost: contacts.filter(c => c.status === 'lost').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-brand-primary-light text-brand-primary';
      case 'active': return 'bg-brand-success-light text-brand-success';
      case 'won': return 'bg-brand-secondary-light text-brand-main';
      case 'lost': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl mb-2">Contacts</h1>
            <p className="text-muted-foreground">Manage your contacts and relationships</p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </Button>
            ))}
          </div>
        </div>

        {/* Contacts Grid */}
        {filteredContacts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No contacts found</p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredContacts.map((contact) => {
              const nextAction = getNextActionForContact(contact.id);

              return (
                <Card
                  key={contact.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/contacts/${contact.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl mb-1 truncate">{contact.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 truncate">
                          <Building className="w-3 h-3 shrink-0" />
                          {contact.company}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(contact.status)}>
                        {contact.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{contact.phone}</span>
                      </div>
                    </div>

                    {nextAction ? (
                      <div className="bg-brand-primary-light rounded-lg p-3 border border-brand-secondary/30">
                        <p className="text-xs text-brand-primary font-medium mb-1">NEXT ACTION</p>
                        <p className="text-sm text-brand-main">{nextAction.description}</p>
                      </div>
                    ) : (
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-xs text-muted-foreground font-medium mb-1">NO NEXT ACTION</p>
                        <p className="text-sm text-muted-foreground">Set a next action to follow up</p>
                      </div>
                    )}

                    {contact.tags.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {contact.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AddContactDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
    </div>
  );
};