import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { useNavigate } from 'react-router';
import { 
  Phone, 
  Mail, 
  Calendar, 
  CheckSquare, 
  ArrowRight,
  Clock,
  TrendingUp,
  Bell,
  Flame,
  Target,
  Zap,
  Loader2
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO, isWithinInterval, addMinutes } from 'date-fns';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { contacts, actions, deals, emailSequences, workflowRules, storeActions } = useAppStore('contacts', 'actions', 'deals', 'emailSequences', 'workflowRules');
  const navigate = useNavigate();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  const activeActions = actions.filter(a => !a.completed).sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  const completedToday = actions.filter(a => 
    a.completed && a.completedAt && isToday(parseISO(a.completedAt))
  ).length;

  const overdueActions = activeActions.filter(a => 
    isPast(parseISO(a.dueDate)) && !isToday(parseISO(a.dueDate))
  );

  const dueSoon = activeActions.filter(a => {
    const dueDate = parseISO(a.dueDate);
    const now = new Date();
    return isWithinInterval(dueDate, { start: now, end: addMinutes(now, 60) });
  }).length;

  const hotLeadsCount = contacts.filter(c => 
    c.status !== 'won' && c.status !== 'lost' &&
    (c.tags.includes('high-priority') || c.tags.includes('urgent') || c.tags.includes('enterprise'))
  ).length;

  const activePipelineValue = deals
    .filter(d => !['closed-won', 'closed-lost'].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);

  const getContactById = (id: string) => contacts.find(c => c.id === id);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      case 'follow-up': return <ArrowRight className="w-4 h-4" />;
      default: return <CheckSquare className="w-4 h-4" />;
    }
  };

  const getDateLabel = (dateString: string) => {
    if (!dateString) return 'No date';
    try {
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      if (isPast(date)) return 'Overdue';
      return format(date, 'MMM d');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getDateColor = (dateString: string) => {
    if (!dateString) return 'text-muted-foreground bg-muted';
    try {
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) return 'text-muted-foreground bg-muted';
      if (isPast(date) && !isToday(date)) return 'text-brand-error bg-brand-error-light';
      if (isToday(date)) return 'text-brand-warning bg-brand-warning-light';
      if (isTomorrow(date)) return 'text-brand-primary bg-brand-primary-light';
      return 'text-muted-foreground bg-muted';
    } catch (error) {
      return 'text-muted-foreground bg-muted';
    }
  };

  const handleCompleteAction = async (actionId: string, description: string) => {
    setLoadingIds(prev => new Set(prev).add(actionId));
    const result = await storeActions.completeAction(actionId);
    setLoadingIds(prev => { const next = new Set(prev); next.delete(actionId); return next; });

    if (result.success) {
      toast.success('Action completed!', { description: `Marked "${description}" as complete` });
    } else {
      toast.error(result.error.message);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2">Action Queue</h1>
          <p className="text-muted-foreground">Your next actions, organized by priority</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary-light rounded-lg">
                  <Clock className="w-6 h-6 text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Actions</p>
                  <p className="text-2xl">{activeActions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-error-light rounded-lg">
                  <ArrowRight className="w-6 h-6 text-brand-error" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl text-brand-error">{overdueActions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-warning-light rounded-lg">
                  <Bell className="w-6 h-6 text-brand-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Soon</p>
                  <p className="text-2xl text-brand-warning">{dueSoon}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-success-light rounded-lg">
                  <TrendingUp className="w-6 h-6 text-brand-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl text-brand-success">{completedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Insights */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/lead-intelligence')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription>Hot Leads</CardDescription>
                  <CardTitle className="text-2xl text-brand-error">{hotLeadsCount}</CardTitle>
                </div>
                <Flame className="h-8 w-8 text-brand-error" />
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" size="sm" className="w-full">
                View Lead Intelligence →
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/goals')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription>Pipeline Value</CardDescription>
                  <CardTitle className="text-2xl">R{Math.round(activePipelineValue).toLocaleString()}</CardTitle>
                </div>
                <Target className="h-8 w-8 text-brand-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" size="sm" className="w-full">
                View Forecasting →
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/automation')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardDescription>Active Automations</CardDescription>
                  <CardTitle className="text-2xl">{emailSequences.length + workflowRules.length}</CardTitle>
                </div>
                <Zap className="h-8 w-8 text-brand-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" size="sm" className="w-full">
                Manage Automation →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Action List */}
        <Card>
          <CardHeader>
            <CardTitle>Next Actions</CardTitle>
            <CardDescription>Complete actions to move deals forward</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {activeActions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p>No pending actions. Great job!</p>
              </div>
            ) : (
              <div className="divide-y">
                {activeActions.map((action) => {
                  const contact = getContactById(action.contactId);
                  if (!contact) return null;
                  const isLoading = loadingIds.has(action.id);

                  return (
                    <div
                      key={action.id}
                      className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          disabled={isLoading}
                          onClick={() => handleCompleteAction(action.id, action.description)}
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                        </Button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="shrink-0">
                              <span className="flex items-center gap-1">
                                {getActionIcon(action.type)}
                                {action.type}
                              </span>
                            </Badge>
                            <span className="text-sm font-medium truncate">
                              {action.description}
                            </span>
                          </div>
                          <button
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                            className="text-sm text-brand-primary hover:underline"
                          >
                            {contact.name} • {contact.company}
                          </button>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Badge className={getDateColor(action.dueDate)}>
                          {getDateLabel(action.dueDate)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/contacts/${contact.id}`)}
                        >
                          View Contact
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};