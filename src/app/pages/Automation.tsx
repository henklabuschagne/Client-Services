import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { Plus, Mail, Workflow, Trash2, Edit, Play, Pause, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function Automation() {
  const { emailSequences, workflowRules, storeActions } = useAppStore('emailSequences', 'workflowRules');
  
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  
  // Email Sequence Form State
  const [sequenceName, setSequenceName] = useState('');
  const [sequenceDescription, setSequenceDescription] = useState('');
  const [sequenceSteps, setSequenceSteps] = useState([
    { id: '1', subject: '', body: '', delayDays: 0, order: 1 }
  ]);

  // Workflow Rule Form State
  const [workflowName, setWorkflowName] = useState('');
  const [workflowTrigger, setWorkflowTrigger] = useState<'deal_stage_change' | 'action_completed' | 'contact_created' | 'deal_created'>('deal_stage_change');
  const [workflowStage, setWorkflowStage] = useState('prospecting');
  const [workflowActionType, setWorkflowActionType] = useState<'create_action' | 'send_email' | 'update_field' | 'assign_to'>('create_action');
  const [workflowActionDescription, setWorkflowActionDescription] = useState('');
  const [workflowDelayDays, setWorkflowDelayDays] = useState('3');

  const handleAddSequenceStep = () => {
    setSequenceSteps([...sequenceSteps, {
      id: (sequenceSteps.length + 1).toString(),
      subject: '',
      body: '',
      delayDays: 0,
      order: sequenceSteps.length + 1
    }]);
  };

  const handleUpdateSequenceStep = (index: number, field: string, value: any) => {
    const updated = [...sequenceSteps];
    updated[index] = { ...updated[index], [field]: value };
    setSequenceSteps(updated);
  };

  const handleRemoveSequenceStep = (index: number) => {
    setSequenceSteps(sequenceSteps.filter((_, i) => i !== index));
  };

  const handleCreateSequence = async () => {
    if (!sequenceName) {
      toast.error('Please enter a sequence name');
      return;
    }

    if (sequenceSteps.some(step => !step.subject || !step.body)) {
      toast.error('Please fill out all email steps');
      return;
    }

    const result = await storeActions.createEmailSequence({
      name: sequenceName,
      description: sequenceDescription,
      emails: sequenceSteps,
      active: true,
    });

    if (result.success) {
      toast.success('Email sequence created successfully!');
      setIsSequenceDialogOpen(false);
      resetSequenceForm();
    } else {
      toast.error(result.error.message);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!workflowName || !workflowActionDescription) {
      toast.error('Please fill out all required fields');
      return;
    }

    const result = await storeActions.createWorkflowRule({
      name: workflowName,
      trigger: workflowTrigger,
      conditions: { stage: workflowStage },
      actions: [{
        type: workflowActionType,
        config: {
          description: workflowActionDescription,
          delayDays: parseInt(workflowDelayDays, 10),
        }
      }],
      active: true,
    });

    if (result.success) {
      toast.success('Workflow automation created successfully!');
      setIsWorkflowDialogOpen(false);
      resetWorkflowForm();
    } else {
      toast.error(result.error.message);
    }
  };

  const resetSequenceForm = () => {
    setSequenceName('');
    setSequenceDescription('');
    setSequenceSteps([{ id: '1', subject: '', body: '', delayDays: 0, order: 1 }]);
  };

  const resetWorkflowForm = () => {
    setWorkflowName('');
    setWorkflowTrigger('deal_stage_change');
    setWorkflowStage('prospecting');
    setWorkflowActionType('create_action');
    setWorkflowActionDescription('');
    setWorkflowDelayDays('3');
  };

  const toggleSequence = async (id: string, active: boolean) => {
    const result = await storeActions.updateEmailSequence(id, { active: !active });
    if (result.success) {
      toast.success(active ? 'Sequence paused' : 'Sequence activated');
    } else {
      toast.error(result.error.message);
    }
  };

  const toggleWorkflow = async (id: string, active: boolean) => {
    const result = await storeActions.updateWorkflowRule(id, { active: !active });
    if (result.success) {
      toast.success(active ? 'Workflow paused' : 'Workflow activated');
    } else {
      toast.error(result.error.message);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl">Sales Automation</h1>
          <p className="text-muted-foreground">Automate repetitive tasks and nurture leads automatically</p>
        </div>
      </div>

      <Tabs defaultValue="sequences" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sequences">
            <Mail className="h-4 w-4 mr-2" />
            Email Sequences
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <Workflow className="h-4 w-4 mr-2" />
            Workflow Automation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sequences" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Create drip campaigns that automatically follow up with leads</p>
            <Dialog open={isSequenceDialogOpen} onOpenChange={setIsSequenceDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Sequence
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Email Sequence</DialogTitle>
                  <DialogDescription>
                    Build an automated email sequence to nurture leads over time
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="sequence-name">Sequence Name *</Label>
                    <Input
                      id="sequence-name"
                      placeholder="e.g., New Lead Nurture Campaign"
                      value={sequenceName}
                      onChange={(e) => setSequenceName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sequence-description">Description</Label>
                    <Textarea
                      id="sequence-description"
                      placeholder="Describe when to use this sequence"
                      value={sequenceDescription}
                      onChange={(e) => setSequenceDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Email Steps</Label>
                      <Button variant="outline" size="sm" onClick={handleAddSequenceStep}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Step
                      </Button>
                    </div>
                    {sequenceSteps.map((step, index) => (
                      <Card key={step.id}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-sm">Email {index + 1}</CardTitle>
                            {sequenceSteps.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveSequenceStep(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label>Delay (days after {index === 0 ? 'sequence start' : `email ${index}`})</Label>
                            <Input
                              type="number"
                              min="0"
                              value={step.delayDays}
                              onChange={(e) => handleUpdateSequenceStep(index, 'delayDays', parseInt(e.target.value, 10))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Subject Line *</Label>
                            <Input
                              placeholder="e.g., Quick question about your needs"
                              value={step.subject}
                              onChange={(e) => handleUpdateSequenceStep(index, 'subject', e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email Body *</Label>
                            <Textarea
                              placeholder="Write your email content here..."
                              rows={4}
                              value={step.body}
                              onChange={(e) => handleUpdateSequenceStep(index, 'body', e.target.value)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSequenceDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateSequence}>Create Sequence</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {emailSequences.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">No email sequences yet</p>
                <p className="text-sm text-gray-500">Create your first automated email sequence to nurture leads</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {emailSequences.map((sequence) => (
                <Card key={sequence.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{sequence.name}</CardTitle>
                          <Badge variant={sequence.active ? 'default' : 'secondary'}>
                            {sequence.active ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        {sequence.description && (
                          <CardDescription className="mt-2">{sequence.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSequence(sequence.id, sequence.active)}
                        >
                          {sequence.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this sequence?')) {
                              const result = await storeActions.deleteEmailSequence(sequence.id);
                              if (result.success) {
                                toast.success('Sequence deleted');
                              } else {
                                toast.error(result.error.message);
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{sequence.emails.length} email steps:</p>
                      {sequence.emails.map((email, index) => (
                        <div key={email.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge variant="outline">{index === 0 ? 'Immediately' : `Day ${email.delayDays}`}</Badge>
                          <span>{email.subject}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Automate actions when specific events occur</p>
            <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Workflow Automation</DialogTitle>
                  <DialogDescription>
                    Automatically perform actions when specific triggers occur
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="workflow-name">Workflow Name *</Label>
                    <Input
                      id="workflow-name"
                      placeholder="e.g., Auto-create follow-up after proposal"
                      value={workflowName}
                      onChange={(e) => setWorkflowName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>When this happens (Trigger)</Label>
                      <Select value={workflowTrigger} onValueChange={(value: any) => setWorkflowTrigger(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deal_stage_change">Deal stage changes</SelectItem>
                          <SelectItem value="action_completed">Action is completed</SelectItem>
                          <SelectItem value="contact_created">New contact is created</SelectItem>
                          <SelectItem value="deal_created">New deal is created</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {workflowTrigger === 'deal_stage_change' && (
                      <div className="space-y-2">
                        <Label>To this stage</Label>
                        <Select value={workflowStage} onValueChange={setWorkflowStage}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
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
                    )}

                    <div className="space-y-2">
                      <Label>Do this (Action)</Label>
                      <Select value={workflowActionType} onValueChange={(value: any) => setWorkflowActionType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="create_action">Create a follow-up action</SelectItem>
                          <SelectItem value="send_email">Send an email</SelectItem>
                          <SelectItem value="update_field">Update a field</SelectItem>
                          <SelectItem value="assign_to">Assign to team member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Action Description *</Label>
                      <Input
                        placeholder="e.g., Follow up on proposal in 3 days"
                        value={workflowActionDescription}
                        onChange={(e) => setWorkflowActionDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Delay (days)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={workflowDelayDays}
                        onChange={(e) => setWorkflowDelayDays(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsWorkflowDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateWorkflow}>Create Workflow</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {workflowRules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">No workflow rules yet</p>
                <p className="text-sm text-gray-500">Create automated workflows to save time on repetitive tasks</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflowRules.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle>{workflow.name}</CardTitle>
                          <Badge variant={workflow.active ? 'default' : 'secondary'}>
                            {workflow.active ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <CardDescription className="mt-2">
                          When {workflow.trigger.replace(/_/g, ' ')} →{' '}
                          {workflow.actions.map(a => a.type.replace(/_/g, ' ')).join(', ')}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWorkflow(workflow.id, workflow.active)}
                        >
                          {workflow.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this workflow?')) {
                              const result = await storeActions.deleteWorkflowRule(workflow.id);
                              if (result.success) {
                                toast.success('Workflow deleted');
                              } else {
                                toast.error(result.error.message);
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}