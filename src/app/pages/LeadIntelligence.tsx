import React, { useState, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { Flame, TrendingUp, Target, AlertCircle, Mail, Phone, Calendar, DollarSign, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import { differenceInDays, parseISO } from 'date-fns';

export default function LeadIntelligence() {
  const { contacts, deals, actions, reads } = useAppStore('contacts', 'deals', 'actions');
  const navigate = useNavigate();

  // Calculate lead scores and enrich data
  const enrichedContacts = useMemo(() => {
    return contacts.map(contact => {
      const contactDeals = deals.filter(d => d.contactId === contact.id);
      const contactActions = actions.filter(a => a.contactId === contact.id && !a.completed);
      const completedActions = actions.filter(a => a.contactId === contact.id && a.completed);
      
      // Calculate lead score
      let score = 0;
      
      // Base score from status
      if (contact.status === 'lead') score += 10;
      if (contact.status === 'active') score += 20;
      if (contact.status === 'won') score += 5; // Lower for already won
      
      // Tags boost
      if (contact.tags.includes('high-priority')) score += 25;
      if (contact.tags.includes('enterprise')) score += 20;
      if (contact.tags.includes('urgent')) score += 30;
      
      // Deal value boost
      const totalDealValue = contactDeals.reduce((sum, d) => sum + d.value, 0);
      if (totalDealValue > 900000) score += 30;
      else if (totalDealValue > 450000) score += 20;
      else if (totalDealValue > 180000) score += 10;
      
      // Deal stage boost
      const proposalDeals = contactDeals.filter(d => d.stage === 'proposal' || d.stage === 'negotiation');
      if (proposalDeals.length > 0) score += 25;
      
      // Activity engagement boost
      const recentActions = completedActions.filter(a => {
        const daysSince = differenceInDays(new Date(), parseISO(a.completedAt || a.createdAt));
        return daysSince <= 7;
      });
      if (recentActions.length >= 3) score += 20;
      else if (recentActions.length >= 1) score += 10;
      
      // Overdue actions penalty
      const overdueActions = contactActions.filter(a => new Date(a.dueDate) < new Date());
      if (overdueActions.length > 0) score += 15; // Actually a boost - urgent!
      
      // Next action urgency
      const nextAction = contactActions.sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )[0];
      
      const daysUntilNextAction = nextAction 
        ? differenceInDays(parseISO(nextAction.dueDate), new Date())
        : 999;
      
      if (daysUntilNextAction <= 1) score += 15;
      
      // Engagement level
      let engagementLevel: 'hot' | 'warm' | 'cold' = 'cold';
      if (score >= 70) engagementLevel = 'hot';
      else if (score >= 40) engagementLevel = 'warm';
      
      // Data quality score
      let dataQuality = 0;
      if (contact.name) dataQuality += 20;
      if (contact.email) dataQuality += 20;
      if (contact.phone) dataQuality += 15;
      if (contact.company) dataQuality += 15;
      if (contact.tags.length > 0) dataQuality += 15;
      if (contactDeals.length > 0) dataQuality += 15;
      
      return {
        ...contact,
        leadScore: Math.min(score, 100),
        engagementLevel,
        dataQualityScore: dataQuality,
        totalDealValue,
        activeDeals: contactDeals.length,
        pendingActions: contactActions.length,
        nextAction,
        daysUntilNextAction,
      };
    });
  }, [contacts, deals, actions]);

  // Filter hot leads
  const hotLeads = enrichedContacts
    .filter(c => c.engagementLevel === 'hot' && c.status !== 'won' && c.status !== 'lost')
    .sort((a, b) => b.leadScore - a.leadScore);
  
  const warmLeads = enrichedContacts
    .filter(c => c.engagementLevel === 'warm' && c.status !== 'won' && c.status !== 'lost')
    .sort((a, b) => b.leadScore - a.leadScore);
  
  const coldLeads = enrichedContacts
    .filter(c => c.engagementLevel === 'cold' && c.status !== 'won' && c.status !== 'lost')
    .sort((a, b) => b.leadScore - a.leadScore);

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'hot': return 'text-red-500';
      case 'warm': return 'text-orange-500';
      default: return 'text-blue-500';
    }
  };

  const getEngagementBadge = (level: string) => {
    switch (level) {
      case 'hot': return 'destructive';
      case 'warm': return 'default';
      default: return 'secondary';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const LeadCard = ({ lead }: { lead: typeof enrichedContacts[0] }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/contacts/${lead.id}`)}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{lead.name}</CardTitle>
              <Badge variant={getEngagementBadge(lead.engagementLevel)}>
                {lead.engagementLevel === 'hot' && <Flame className="h-3 w-3 mr-1" />}
                {lead.engagementLevel.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>{lead.company}</CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Star className={`h-4 w-4 ${getEngagementColor(lead.engagementLevel)}`} />
              <span className="font-bold text-lg">{lead.leadScore}</span>
            </div>
            <p className="text-xs text-gray-500">Lead Score</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="font-medium">R{lead.totalDealValue.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-400" />
            <span>{lead.activeDeals} active deals</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <span>{lead.pendingActions} pending actions</span>
          </div>
          {lead.nextAction && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className={lead.daysUntilNextAction <= 1 ? 'text-red-500 font-medium' : ''}>
                {lead.daysUntilNextAction === 0 ? 'Today' : 
                 lead.daysUntilNextAction < 0 ? `${Math.abs(lead.daysUntilNextAction)}d overdue` :
                 `${lead.daysUntilNextAction}d`}
              </span>
            </div>
          )}
        </div>
        
        {lead.nextAction && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-gray-500 mb-1">NEXT ACTION</p>
            <p className="text-sm">{lead.nextAction.description}</p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1">
          {lead.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl">Lead Intelligence</h1>
        <p className="text-muted-foreground">AI-powered lead scoring and prioritization</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-500">{hotLeads.length}</p>
                <p className="text-sm text-gray-600">Hot Leads</p>
              </div>
              <Flame className="h-8 w-8 text-red-500" />
            </div>
            <Progress value={(hotLeads.length / enrichedContacts.length) * 100} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-500">{warmLeads.length}</p>
                <p className="text-sm text-gray-600">Warm Leads</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <Progress value={(warmLeads.length / enrichedContacts.length) * 100} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-500">{coldLeads.length}</p>
                <p className="text-sm text-gray-600">Cold Leads</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={(coldLeads.length / enrichedContacts.length) * 100} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(enrichedContacts.reduce((sum, c) => sum + c.leadScore, 0) / enrichedContacts.length)}
                </p>
                <p className="text-sm text-gray-600">Avg Lead Score</p>
              </div>
              <Star className="h-8 w-8 text-gray-400" />
            </div>
            <Progress 
              value={enrichedContacts.reduce((sum, c) => sum + c.leadScore, 0) / enrichedContacts.length} 
              className="mt-3 h-2" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Lead Lists */}
      <Tabs defaultValue="hot" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hot">
            <Flame className="h-4 w-4 mr-2" />
            Hot Leads ({hotLeads.length})
          </TabsTrigger>
          <TabsTrigger value="warm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Warm Leads ({warmLeads.length})
          </TabsTrigger>
          <TabsTrigger value="cold">
            <Target className="h-4 w-4 mr-2" />
            Cold Leads ({coldLeads.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All Leads ({enrichedContacts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hot" className="space-y-4">
          {hotLeads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Flame className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No hot leads at the moment</p>
                <p className="text-sm text-gray-500">Keep nurturing your leads to increase their scores</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {hotLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="warm" className="space-y-4">
          {warmLeads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No warm leads at the moment</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {warmLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cold" className="space-y-4">
          {coldLeads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Target className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No cold leads</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {coldLeads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {enrichedContacts
              .sort((a, b) => b.leadScore - a.leadScore)
              .map(lead => <LeadCard key={lead.id} lead={lead} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}