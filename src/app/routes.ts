import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Contacts } from './pages/Contacts';
import { ContactDetail } from './pages/ContactDetail';
import { CalendarView } from './pages/CalendarView';
import { Pipeline } from './pages/Pipeline';
import { Analytics } from './pages/Analytics';
import { EmailTemplates } from './pages/EmailTemplates';
import { ImportExport } from './pages/ImportExport';
import Automation from './pages/Automation';
import LeadIntelligence from './pages/LeadIntelligence';
import DataAndTeam from './pages/DataAndTeam';
import GoalsAndForecasting from './pages/GoalsAndForecasting';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'contacts', Component: Contacts },
      { path: 'contacts/:id', Component: ContactDetail },
      { path: 'calendar', Component: CalendarView },
      { path: 'pipeline', Component: Pipeline },
      { path: 'analytics', Component: Analytics },
      { path: 'templates', Component: EmailTemplates },
      { path: 'import-export', Component: ImportExport },
      { path: 'automation', Component: Automation },
      { path: 'lead-intelligence', Component: LeadIntelligence },
      { path: 'data-team', Component: DataAndTeam },
      { path: 'goals', Component: GoalsAndForecasting },
    ],
  },
]);