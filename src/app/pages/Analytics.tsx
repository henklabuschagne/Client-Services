import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, DollarSign, Target, Clock, Award, AlertCircle } from 'lucide-react';
import { format, parseISO, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const Analytics = () => {
  const { deals, actions, contacts } = useAppStore('deals', 'actions', 'contacts');

  // Revenue by month
  const getRevenueByMonth = () => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const wonDeals = deals.filter(deal => {
        if (deal.stage !== 'closed-won' || !deal.expectedCloseDate) return false;
        try {
          const closeDate = parseISO(deal.expectedCloseDate);
          if (isNaN(closeDate.getTime())) return false;
          return closeDate >= monthStart && closeDate <= monthEnd;
        } catch {
          return false;
        }
      });

      const revenue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);

      return {
        month: format(month, 'MMM yyyy'),
        revenue: revenue,
        deals: wonDeals.length,
      };
    });
  };

  // Pipeline value by stage
  const getPipelineByStage = () => {
    const stages = [
      { key: 'prospecting', label: 'Prospecting' },
      { key: 'qualification', label: 'Qualification' },
      { key: 'proposal', label: 'Proposal' },
      { key: 'negotiation', label: 'Negotiation' },
    ];

    return stages.map(stage => {
      const stageDeals = deals.filter(d => d.stage === stage.key);
      const value = stageDeals.reduce((sum, d) => sum + d.value, 0);
      const weightedValue = stageDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);

      return {
        stage: stage.label,
        value: value,
        weightedValue: weightedValue,
        count: stageDeals.length,
      };
    });
  };

  // Win/Loss ratio
  const getWinLossRatio = () => {
    const won = deals.filter(d => d.stage === 'closed-won').length;
    const lost = deals.filter(d => d.stage === 'closed-lost').length;
    const open = deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).length;

    return [
      { name: 'Won', value: won || 0, color: '#10b981' },
      { name: 'Lost', value: lost || 0, color: '#ef4444' },
      { name: 'Open', value: open || 0, color: '#3b82f6' },
    ].filter(d => d.value > 0);
  };

  // Conversion rates
  const getConversionRates = () => {
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation'];
    const conversionData = [];

    for (let i = 0; i < stages.length; i++) {
      const currentStage = stages[i];
      const nextStage = stages[i + 1];

      const currentCount = deals.filter(d => d.stage === currentStage).length;
      const nextCount = nextStage ? deals.filter(d => d.stage === nextStage).length : 0;

      const conversionRate = currentCount > 0 ? (nextCount / currentCount) * 100 : 0;

      conversionData.push({
        stage: currentStage.charAt(0).toUpperCase() + currentStage.slice(1),
        rate: Math.round(conversionRate),
        deals: currentCount,
      });
    }

    return conversionData;
  };

  // KPIs
  const totalRevenue = deals
    .filter(d => d.stage === 'closed-won')
    .reduce((sum, d) => sum + d.value, 0);

  const forecastedRevenue = deals
    .filter(d => !['closed-won', 'closed-lost'].includes(d.stage))
    .reduce((sum, d) => sum + (d.value * d.probability / 100), 0);

  const avgDealSize = deals.length > 0
    ? deals.reduce((sum, d) => sum + d.value, 0) / deals.length
    : 0;

  const wonDeals = deals.filter(d => d.stage === 'closed-won');
  const avgSalesCycle = wonDeals.length > 0
    ? wonDeals.reduce((sum, d) => {
        const created = parseISO(d.createdAt);
        const closed = parseISO(d.expectedCloseDate);
        return sum + differenceInDays(closed, created);
      }, 0) / wonDeals.length
    : 0;

  const winRate = deals.filter(d => ['closed-won', 'closed-lost'].includes(d.stage)).length > 0
    ? (wonDeals.length / deals.filter(d => ['closed-won', 'closed-lost'].includes(d.stage)).length) * 100
    : 0;

  const completedActions = actions.filter(a => a.completed).length;
  const totalActions = actions.length;
  const completionRate = totalActions > 0 ? (completedActions / totalActions) * 100 : 0;

  const revenueData = getRevenueByMonth();
  const pipelineData = getPipelineByStage();
  const winLossData = getWinLossRatio();
  const conversionData = getConversionRates();

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl">Analytics Dashboard</h1>
        <p className="text-muted-foreground mt-1">Comprehensive sales performance metrics and insights</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-success-light rounded-lg">
                <DollarSign className="w-6 h-6 text-brand-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl">
                  R{(totalRevenue / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {wonDeals.length} deals closed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-primary-light rounded-lg">
                <TrendingUp className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forecasted Revenue</p>
                <p className="text-2xl">
                  R{(forecastedRevenue / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Weighted by probability
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-secondary-light rounded-lg">
                <Target className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Deal Size</p>
                <p className="text-2xl">
                  R{(avgDealSize / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across {deals.length} deals
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-warning-light rounded-lg">
                <Clock className="w-6 h-6 text-brand-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Sales Cycle</p>
                <p className="text-2xl">
                  {Math.round(avgSalesCycle)} days
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Time to close
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-success-light rounded-lg">
                <Award className="w-6 h-6 text-brand-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl">
                  {winRate.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {wonDeals.length} won / {deals.filter(d => ['closed-won', 'closed-lost'].includes(d.stage)).length} closed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-primary-light rounded-lg">
                <AlertCircle className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Action Completion</p>
                <p className="text-2xl">
                  {completionRate.toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedActions} / {totalActions} actions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <p className="text-sm text-muted-foreground">Closed deals by month</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => `R${(value / 1000).toFixed(1)}K`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pipeline by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <p className="text-sm text-muted-foreground">Current pipeline value and weighted forecast</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => `R${(value / 1000).toFixed(1)}K`}
                />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Total Value" radius={[8, 8, 0, 0]} />
                <Bar dataKey="weightedValue" fill="#10b981" name="Weighted Value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win/Loss Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Status Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Won, lost, and open deals</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={winLossData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {winLossData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Stage Conversion Rates</CardTitle>
            <p className="text-sm text-muted-foreground">Percentage moving to next stage</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="stage" type="category" />
                <Tooltip 
                  formatter={(value: any) => `${value}%`}
                />
                <Legend />
                <Bar dataKey="rate" fill="#8b5cf6" name="Conversion Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Contact Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Activity Summary</CardTitle>
          <p className="text-sm text-muted-foreground">Overview of contact engagement</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Contacts</p>
              <p className="text-2xl mt-1">{contacts.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Contacts</p>
              <p className="text-2xl text-brand-success mt-1">
                {contacts.filter(c => c.status === 'active').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leads</p>
              <p className="text-2xl text-brand-primary mt-1">
                {contacts.filter(c => c.status === 'lead').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Won Clients</p>
              <p className="text-2xl text-brand-main mt-1">
                {contacts.filter(c => c.status === 'won').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};