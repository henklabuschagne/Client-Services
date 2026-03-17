import { Link, Outlet, useLocation } from 'react-router';
import { LayoutDashboard, Users, CheckCircle2, Calendar, TrendingUp, BarChart3, Mail, Download, Zap, Flame, Shield, Target } from 'lucide-react';

export const Layout = () => {
  const location = useLocation();

  const mainNavItems = [
    { path: '/', icon: LayoutDashboard, label: 'Action Queue' },
    { path: '/contacts', icon: Users, label: 'Contacts' },
    { path: '/lead-intelligence', icon: Flame, label: 'Lead Intelligence' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/pipeline', icon: TrendingUp, label: 'Pipeline' },
  ];

  const insightsNavItems = [
    { path: '/goals', icon: Target, label: 'Goals & Forecasting' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const toolsNavItems = [
    { path: '/automation', icon: Zap, label: 'Automation' },
    { path: '/data-team', icon: Shield, label: 'Data & Team' },
    { path: '/templates', icon: Mail, label: 'Email Templates' },
    { path: '/import-export', icon: Download, label: 'Import/Export' },
  ];

  const renderNavItem = (item: { path: string; icon: any; label: string }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <li key={item.path}>
        <Link
          to={item.path}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
            isActive
              ? 'bg-brand-primary-light text-brand-primary'
              : 'text-foreground/80 hover:bg-muted hover:text-foreground'
          }`}
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-brand-primary' : 'text-muted-foreground'}`} />
          <span className="text-sm">{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-white h-screen flex flex-col border-r border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-primary-light rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-brand-main text-xl">ActionCRM</h1>
              <p className="text-xs text-muted-foreground">Next Action Focus</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs text-muted-foreground px-4 py-2 uppercase tracking-wider">Sales</p>
          <ul className="space-y-1">
            {mainNavItems.map(renderNavItem)}
          </ul>

          <div className="my-4 border-t border-border" />

          <p className="text-xs text-muted-foreground px-4 py-2 uppercase tracking-wider">Insights</p>
          <ul className="space-y-1">
            {insightsNavItems.map(renderNavItem)}
          </ul>

          <div className="my-4 border-t border-border" />

          <p className="text-xs text-muted-foreground px-4 py-2 uppercase tracking-wider">Tools</p>
          <ul className="space-y-1">
            {toolsNavItems.map(renderNavItem)}
          </ul>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="bg-brand-primary-light rounded-lg p-4">
            <p className="text-sm text-brand-main">GTD Principle</p>
            <p className="text-xs text-brand-primary mt-1">
              Always set a Next Action for every contact
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};
