import React, { useState, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Trash2, 
  UserPlus,
  TrendingUp,
  Activity,
  Target,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';

export default function DataAndTeam() {
  const { contacts, deals, actions, reads, storeActions } = useAppStore('contacts', 'deals', 'actions');
  const navigate = useNavigate();
  
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [bulkAssignTo, setBulkAssignTo] = useState('');
  const [bulkTag, setBulkTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Team members (mock data - in real app, this would come from auth/user management)
  const teamMembers = [
    { id: '1', name: 'John Smith', email: 'john@company.com', role: 'Sales Rep', activeContacts: 8, thisMonthDeals: 3 },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Sales Rep', activeContacts: 12, thisMonthDeals: 5 },
    { id: '3', name: 'Mike Chen', email: 'mike@company.com', role: 'Sales Manager', activeContacts: 5, thisMonthDeals: 2 },
  ];

  // Calculate data quality for each contact
  const contactsWithQuality = useMemo(() => {
    return contacts.map(contact => {
      let score = 0;
      let issues: string[] = [];
      
      // Check required fields
      if (contact.name) score += 20;
      else issues.push('Missing name');
      
      if (contact.email) score += 20;
      else issues.push('Missing email');
      
      if (contact.phone) score += 15;
      else issues.push('Missing phone');
      
      if (contact.company) score += 15;
      else issues.push('Missing company');
      
      if (contact.tags.length > 0) score += 15;
      else issues.push('No tags');
      
      // Check for associated data
      const contactDeals = deals.filter(d => d.contactId === contact.id);
      if (contactDeals.length > 0) score += 15;
      else issues.push('No deals');
      
      return {
        ...contact,
        dataQualityScore: score,
        dataIssues: issues,
      };
    });
  }, [contacts, deals]);

  // Find duplicates
  const duplicates = useMemo(() => {
    const emailMap = new Map<string, typeof contactsWithQuality>();
    const dupes: typeof contactsWithQuality[] = [];
    
    contactsWithQuality.forEach(contact => {
      const normalizedEmail = contact.email.toLowerCase();
      if (emailMap.has(normalizedEmail)) {
        dupes.push(contact);
        if (!dupes.find(d => d.id === emailMap.get(normalizedEmail)!.id)) {
          dupes.push(emailMap.get(normalizedEmail)!);
        }
      } else {
        emailMap.set(normalizedEmail, contact);
      }
    });
    
    return dupes;
  }, [contactsWithQuality]);

  // Data quality stats
  const qualityStats = useMemo(() => {
    const highQuality = contactsWithQuality.filter(c => c.dataQualityScore >= 80).length;
    const mediumQuality = contactsWithQuality.filter(c => c.dataQualityScore >= 50 && c.dataQualityScore < 80).length;
    const lowQuality = contactsWithQuality.filter(c => c.dataQualityScore < 50).length;
    const avgScore = contactsWithQuality.reduce((sum, c) => sum + c.dataQualityScore, 0) / contactsWithQuality.length;
    
    return { highQuality, mediumQuality, lowQuality, avgScore };
  }, [contactsWithQuality]);

  const handleSelectContact = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const handleBulkAction = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Please select contacts first');
      return;
    }

    switch (bulkAction) {
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedContacts.length} contacts?`)) {
          await storeActions.bulkDeleteContacts(selectedContacts);
          toast.success(`Deleted ${selectedContacts.length} contacts`);
          setSelectedContacts([]);
        }
        break;
      case 'assign':
        if (!bulkAssignTo) {
          toast.error('Please select a team member');
          return;
        }
        await storeActions.bulkUpdateContacts(selectedContacts, { assignedTo: bulkAssignTo });
        toast.success(`Assigned ${selectedContacts.length} contacts to ${bulkAssignTo}`);
        setSelectedContacts([]);
        break;
      case 'tag':
        if (!bulkTag) {
          toast.error('Please enter a tag');
          return;
        }
        for (const id of selectedContacts) {
          const contact = contacts.find(c => c.id === id);
          if (contact && !contact.tags.includes(bulkTag)) {
            await storeActions.updateContact(id, { tags: [...contact.tags, bulkTag] });
          }
        }
        toast.success(`Added tag "${bulkTag}" to ${selectedContacts.length} contacts`);
        setSelectedContacts([]);
        setBulkTag('');
        break;
      default:
        toast.error('Please select an action');
    }
  };

  const filteredContacts = contactsWithQuality.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const getQualityBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 50) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl">Data Quality & Team</h1>
        <p className="text-muted-foreground">Manage data quality, prevent duplicates, and collaborate with your team</p>
      </div>

      <Tabs defaultValue="quality" className="space-y-6">
        <TabsList>
          <TabsTrigger value="quality">
            <Shield className="h-4 w-4 mr-2" />
            Data Quality
          </TabsTrigger>
          <TabsTrigger value="duplicates">
            <Copy className="h-4 w-4 mr-2" />
            Duplicates
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <Target className="h-4 w-4 mr-2" />
            Bulk Actions
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
        </TabsList>

        {/* Data Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold text-green-500">{qualityStats.highQuality}</p>
                    <p className="text-sm text-gray-600">High Quality</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={(qualityStats.highQuality / contacts.length) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold text-orange-500">{qualityStats.mediumQuality}</p>
                    <p className="text-sm text-gray-600">Medium Quality</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
                <Progress value={(qualityStats.mediumQuality / contacts.length) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold text-red-500">{qualityStats.lowQuality}</p>
                    <p className="text-sm text-gray-600">Low Quality</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <Progress value={(qualityStats.lowQuality / contacts.length) * 100} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-2xl font-bold">{Math.round(qualityStats.avgScore)}%</p>
                    <p className="text-sm text-gray-600">Avg Quality Score</p>
                  </div>
                  <Shield className="h-8 w-8 text-gray-400" />
                </div>
                <Progress value={qualityStats.avgScore} className="h-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Contact Data Quality</CardTitle>
              <CardDescription>Review and improve data completeness for each contact</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Quality Score</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactsWithQuality
                    .sort((a, b) => a.dataQualityScore - b.dataQualityScore)
                    .slice(0, 20)
                    .map(contact => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-gray-500">{contact.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{contact.company}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={contact.dataQualityScore} className="w-20 h-2" />
                            <span className={`font-medium ${getQualityColor(contact.dataQualityScore)}`}>
                              {contact.dataQualityScore}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {contact.dataIssues.slice(0, 2).map(issue => (
                              <Badge key={issue} variant="outline" className="text-xs">
                                {issue}
                              </Badge>
                            ))}
                            {contact.dataIssues.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{contact.dataIssues.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                          >
                            Fix Issues
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Duplicates Tab */}
        <TabsContent value="duplicates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Potential Duplicate Contacts</CardTitle>
              <CardDescription>
                {duplicates.length > 0 
                  ? `Found ${duplicates.length} potential duplicate contacts based on email addresses`
                  : 'No duplicate contacts detected'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {duplicates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <p className="text-gray-600">No duplicates found!</p>
                  <p className="text-sm text-gray-500">Your contact database is clean</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicates.map(contact => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.company}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{contact.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Actions Tab */}
        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Contact Management</CardTitle>
              <CardDescription>Select multiple contacts and perform actions at once</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label>Search Contacts</Label>
                  <Input
                    placeholder="Search by name, email, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="w-48">
                  <Label>Action</Label>
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assign">Assign to team member</SelectItem>
                      <SelectItem value="tag">Add tag</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {bulkAction === 'assign' && (
                  <div className="w-48">
                    <Label>Assign To</Label>
                    <Select value={bulkAssignTo} onValueChange={setBulkAssignTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map(member => (
                          <SelectItem key={member.id} value={member.name}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {bulkAction === 'tag' && (
                  <div className="w-48">
                    <Label>Tag Name</Label>
                    <Input
                      placeholder="e.g., hot-lead"
                      value={bulkTag}
                      onChange={(e) => setBulkTag(e.target.value)}
                    />
                  </div>
                )}
                <Button onClick={handleBulkAction} disabled={selectedContacts.length === 0}>
                  Apply to {selectedContacts.length} contacts
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tags</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map(contact => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedContacts.includes(contact.id)}
                            onCheckedChange={() => handleSelectContact(contact.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell>{contact.company}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{contact.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {contact.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{contact.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {teamMembers.map(member => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                    </div>
                    <Badge>{member.activeContacts} contacts</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">This Month</span>
                      <span className="font-medium">{member.thisMonthDeals} deals closed</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Email</span>
                      <span className="text-sm">{member.email}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" size="sm">
                    View Activity
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Activity Feed</CardTitle>
              <CardDescription>Recent actions by team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { member: 'Sarah Johnson', action: 'closed a deal', contact: 'TechCorp Inc.', time: '2 hours ago' },
                  { member: 'John Smith', action: 'completed a call with', contact: 'Design Studio', time: '3 hours ago' },
                  { member: 'Mike Chen', action: 'added a note to', contact: 'Marketing Pro', time: '5 hours ago' },
                  { member: 'Sarah Johnson', action: 'sent proposal to', contact: 'Startup XYZ', time: '1 day ago' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0">
                    <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.member}</span>{' '}
                        {activity.action}{' '}
                        <span className="font-medium">{activity.contact}</span>
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}