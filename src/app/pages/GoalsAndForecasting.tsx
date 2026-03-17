import React, { useState, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { Target, TrendingUp, TrendingDown, AlertCircle, Plus, Trash2, DollarSign, Calendar, Award, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, differenceInDays, parseISO, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';

export default function GoalsAndForecasting() {
  const { deals, salesGoals, contacts, actions, storeActions } = useAppStore('deals', 'salesGoals', 'contacts', 'actions');
  
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalPeriod, setGoalPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // Calculate current period dates
  const now = new Date();
  const periodDates = {
    monthly: { start: startOfMonth(now), end: endOfMonth(now) },
    quarterly: { start: startOfQuarter(now), end: endOfQuarter(now) },
    yearly: { start: startOfYear(now), end: endOfYear(now) },
  };

  // Calculate revenue metrics
  const revenueMetrics = useMemo(() => {
    const wonDeals = deals.filter(d => d.stage === 'closed-won');
    const pipelineDeals = deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage));
    
    const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const pipelineValue = pipelineDeals.reduce((sum, d) => sum + d.value, 0);
    const weightedPipeline = pipelineDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
    
    // Best case, worst case, likely case forecasts
    const bestCase = pipelineDeals.reduce((sum, d) => sum + d.value, 0);
    const worstCase = pipelineDeals
      .filter(d => d.probability >= 70)
      .reduce((sum, d) => sum + d.value, 0);
    const likelyCase = weightedPipeline;
    
    return {
      totalRevenue,
      pipelineValue,
      weightedPipeline,
      bestCase,
      worstCase,
      likelyCase,
    };
  }, [deals]);

  // Deal age analysis
  const dealAgeAnalysis = useMemo(() => {
    return deals
      .filter(d => !['closed-won', 'closed-lost'].includes(d.stage))
      .map(deal => {
        const age = differenceInDays(now, parseISO(deal.createdAt));
        const daysUntilClose = differenceInDays(parseISO(deal.expectedCloseDate), now);
        
        let status: 'on-track' | 'at-risk' | 'stale' = 'on-track';
        if (age > 90) status = 'stale';
        else if (age > 60 || daysUntilClose < 7) status = 'at-risk';
        
        return {
          ...deal,
          age,
          daysUntilClose,
          status,
        };
      })
      .sort((a, b) => b.age - a.age);
  }, [deals, now]);

  const staleDeals = dealAgeAnalysis.filter(d => d.status === 'stale');
  const atRiskDeals = dealAgeAnalysis.filter(d => d.status === 'at-risk');

  // Forecast by stage
  const forecastByStage = useMemo(() => {
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation'];
    return stages.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage);
      return {
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
        weighted: stageDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0),
      };
    });
  }, [deals]);

  // Conversion funnel
  const conversionFunnel = useMemo(() => {
    const stages = [
      { stage: 'Prospecting', deals: deals.filter(d => d.stage === 'prospecting').length },
      { stage: 'Qualification', deals: deals.filter(d => d.stage === 'qualification').length },
      { stage: 'Proposal', deals: deals.filter(d => d.stage === 'proposal').length },
      { stage: 'Negotiation', deals: deals.filter(d => d.stage === 'negotiation').length },
      { stage: 'Closed Won', deals: deals.filter(d => d.stage === 'closed-won').length },
    ];
    
    return stages.map((s, i) => ({
      ...s,
      conversionRate: i > 0 && stages[i - 1].deals > 0 
        ? ((s.deals / stages[i - 1].deals) * 100).toFixed(1)
        : '100.0',
    }));
  }, [deals]);

  // Historical performance (mock data - would be real historical data in production)
  const historicalData = [
    { month: 'Aug', actual: 2160000, forecast: 2070000, target: 1980000 },
    { month: 'Sep', actual: 2430000, forecast: 2340000, target: 2160000 },
    { month: 'Oct', actual: 2610000, forecast: 2520000, target: 2340000 },
    { month: 'Nov', actual: 2880000, forecast: 2790000, target: 2520000 },
    { month: 'Dec', actual: 3240000, forecast: 3150000, target: 2700000 },
    { month: 'Jan', actual: 2970000, forecast: 3060000, target: 2880000 },
    { month: 'Feb', actual: 0, forecast: revenueMetrics.likelyCase, target: 3060000 },
  ];

  const handleCreateGoal = async () => {
    if (!goalName || !goalTarget) {
      toast.error('Please fill out all fields');
      return;
    }

    const dates = periodDates[goalPeriod];
    const result = await storeActions.createSalesGoal({
      name: goalName,
      targetValue: parseInt(goalTarget, 10),
      currentValue: revenueMetrics.totalRevenue,
      period: goalPeriod,
      startDate: dates.start.toISOString(),
      endDate: dates.end.toISOString(),
    });

    if (result.success) {
      toast.success('Sales goal created!');
      setIsGoalDialogOpen(false);
      setGoalName('');
      setGoalTarget('');
    } else {
      toast.error(result.error.message);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl">Goals & Forecasting</h1>
          <p className="text-muted-foreground">Track performance, set targets, and predict future revenue</p>
        </div>
        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Set Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Sales Goal</DialogTitle>
              <DialogDescription>Set a revenue target for your team</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Name</Label>
                <Input
                  placeholder="e.g., Q1 Revenue Target"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Amount (ZAR)</Label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={goalTarget}
                  onChange={(e) => setGoalTarget(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Time Period</Label>
                <Select value={goalPeriod} onValueChange={(value: any) => setGoalPeriod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateGoal}>Create Goal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Revenue Forecast Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Likely Case</p>
                <p className="text-2xl font-bold">R{Math.round(revenueMetrics.likelyCase).toLocaleString()}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Weighted by probability</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Best Case</p>
                <p className="text-2xl font-bold text-green-500">R{Math.round(revenueMetrics.bestCase).toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">If all deals close</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Worst Case</p>
                <p className="text-2xl font-bold text-orange-500">R{Math.round(revenueMetrics.worstCase).toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">High probability deals only</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pipeline Value</p>
                <p className="text-2xl font-bold">R{Math.round(revenueMetrics.pipelineValue).toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Total in pipeline</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Goals */}
      {salesGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
            <CardDescription>Track progress towards your revenue targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {salesGoals.map(goal => {
              const progress = (goal.currentValue / goal.targetValue) * 100;
              const remaining = goal.targetValue - goal.currentValue;
              
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{goal.name}</h4>
                        <Badge variant="outline">{goal.period}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        R{goal.currentValue.toLocaleString()} of R{goal.targetValue.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        const result = await storeActions.deleteSalesGoal(goal.id);
                        if (result.success) {
                          toast.success('Goal deleted');
                        } else {
                          toast.error(result.error.message);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-sm">
                    <span className={progress >= 100 ? 'text-green-500 font-medium' : 'text-gray-600'}>
                      {progress.toFixed(1)}% complete
                    </span>
                    <span className="text-gray-600">
                      R{remaining.toLocaleString()} remaining
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Deal Age Warnings */}
      {(staleDeals.length > 0 || atRiskDeals.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          {staleDeals.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <CardTitle>Stale Deals</CardTitle>
                </div>
                <CardDescription>{staleDeals.length} deals over 90 days old</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {staleDeals.slice(0, 3).map(deal => {
                  const contact = contacts.find(c => c.id === deal.contactId);
                  return (
                    <div key={deal.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{deal.title}</p>
                        <p className="text-xs text-gray-600">{contact?.company}</p>
                      </div>
                      <Badge variant="destructive">{deal.age} days</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {atRiskDeals.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <CardTitle>At-Risk Deals</CardTitle>
                </div>
                <CardDescription>{atRiskDeals.length} deals need attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {atRiskDeals.slice(0, 3).map(deal => {
                  const contact = contacts.find(c => c.id === deal.contactId);
                  return (
                    <div key={deal.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{deal.title}</p>
                        <p className="text-xs text-gray-600">{contact?.company}</p>
                      </div>
                      <Badge variant="secondary">{deal.age} days</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Historical Performance</CardTitle>
            <CardDescription>Forecast accuracy vs actual revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => `R${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Actual" />
                <Line type="monotone" dataKey="forecast" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                <Line type="monotone" dataKey="target" stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3" name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <CardDescription>Deal value distribution across stages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={forecastByStage}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip formatter={(value: any) => `R${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Total Value" radius={[8, 8, 0, 0]} />
                <Bar dataKey="weighted" fill="#10b981" name="Weighted Value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>How deals progress through stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conversionFunnel.map((stage, index) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{stage.deals} deals</Badge>
                      {index > 0 && (
                        <Badge variant="secondary">{stage.conversionRate}%</Badge>
                      )}
                    </div>
                  </div>
                  <Progress 
                    value={index === 0 ? 100 : parseFloat(stage.conversionRate)} 
                    className="h-3"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Forecast Confidence</CardTitle>
            <CardDescription>Revenue probability distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Best Case', value: Math.max(0, revenueMetrics.bestCase - revenueMetrics.likelyCase) || 1 },
                    { name: 'Likely Case', value: Math.max(0, revenueMetrics.likelyCase - revenueMetrics.worstCase) || 1 },
                    { name: 'Worst Case', value: revenueMetrics.worstCase || 1 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: R${Math.round(entry.value).toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  <Cell key="cell-best" fill={COLORS[0]} />
                  <Cell key="cell-likely" fill={COLORS[1]} />
                  <Cell key="cell-worst" fill={COLORS[2]} />
                </Pie>
                <Tooltip formatter={(value: any) => `R${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}