// ─── CRM Centralized Data Store ────────────────────────────
// All application state lives here. Components NEVER import this directly.
// Only the API layer and the reactive hook import this module.

import { isBefore, parseISO } from 'date-fns';

// ─── Type Definitions ──────────────────────────────────────

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'lead' | 'active' | 'won' | 'lost';
  createdAt: string;
  tags: string[];
  leadScore?: number;
  leadSource?: string;
  lastContactedAt?: string;
  assignedTo?: string;
  engagementLevel?: 'hot' | 'warm' | 'cold';
  dataQualityScore?: number;
}

export interface Action {
  id: string;
  contactId: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'follow-up';
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  recurringPattern?: 'daily' | 'weekly' | 'monthly' | null;
  reminderSent?: boolean;
}

export interface Note {
  id: string;
  contactId: string;
  content: string;
  createdAt: string;
  type?: 'note' | 'call-log' | 'email-log' | 'meeting-note';
  createdBy?: string;
  mentions?: string[];
}

export interface Deal {
  id: string;
  contactId: string;
  title: string;
  value: number;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: string;
  createdAt: string;
  updatedAt: string;
  leadSource?: string;
  campaignId?: string;
  stageHistory?: StageHistoryEntry[];
  ageInDays?: number;
}

export interface StageHistoryEntry {
  stage: string;
  enteredAt: string;
  exitedAt?: string;
}

export interface EmailSequence {
  id: string;
  name: string;
  description: string;
  emails: EmailSequenceStep[];
  active: boolean;
  createdAt: string;
}

export interface EmailSequenceStep {
  id: string;
  subject: string;
  body: string;
  delayDays: number;
  order: number;
}

export interface WorkflowRule {
  id: string;
  name: string;
  trigger: 'deal_stage_change' | 'action_completed' | 'contact_created' | 'deal_created';
  conditions: Record<string, any>;
  actions: WorkflowAction[];
  active: boolean;
  createdAt: string;
}

export interface WorkflowAction {
  type: 'create_action' | 'send_email' | 'update_field' | 'assign_to';
  config: Record<string, any>;
}

export interface LeadSourceStats {
  source: string;
  count: number;
  conversionRate: number;
  totalValue: number;
}

export interface SalesGoal {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
}

export interface AppNotification {
  id: string;
  type: 'overdue_action' | 'hot_lead' | 'deal_age_warning' | 'sla_breach' | 'reminder';
  title: string;
  message: string;
  contactId?: string;
  actionId?: string;
  dealId?: string;
  createdAt: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: 'follow-up' | 'introduction' | 'proposal' | 'meeting' | 'closing' | 'general';
}

// ─── Subscriber System ─────────────────────────────────────

export type Slice =
  | 'contacts'
  | 'actions'
  | 'notes'
  | 'deals'
  | 'emailSequences'
  | 'workflowRules'
  | 'salesGoals'
  | 'notifications'
  | 'emailTemplates';

type Listener = () => void;

const subscribers: Record<Slice, Set<Listener>> = {
  contacts: new Set(),
  actions: new Set(),
  notes: new Set(),
  deals: new Set(),
  emailSequences: new Set(),
  workflowRules: new Set(),
  salesGoals: new Set(),
  notifications: new Set(),
  emailTemplates: new Set(),
};

function notify(slice: Slice) {
  subscribers[slice].forEach(fn => fn());
}

// ─── ID Generator ──────────────────────────────────────────

let idCounter = 100;
function generateId(): string {
  return (++idCounter).toString();
}

// ─── Seed Data ─────────────────────────────────────────────

const initialContacts: Contact[] = [
  { id: '1', name: 'Thabo Molefe', email: 'thabo.molefe@naspersdigital.co.za', company: 'Naspers Digital', phone: '+27 (011) 523-4567', status: 'active', createdAt: '2026-02-01T10:00:00Z', tags: ['enterprise', 'high-priority'] },
  { id: '2', name: 'Priya Naidoo', email: 'priya@ubuntudesign.co.za', company: 'Ubuntu Design Studio', phone: '+27 (031) 234-5678', status: 'lead', createdAt: '2026-02-10T14:30:00Z', tags: ['design', 'small-business'] },
  { id: '3', name: 'Zanele Dlamini', email: 'zanele.d@springbokmarketing.co.za', company: 'Springbok Marketing', phone: '+27 (012) 345-6789', status: 'active', createdAt: '2026-01-15T09:00:00Z', tags: ['marketing', 'recurring'] },
  { id: '4', name: 'Sipho Mabena', email: 'sipho@capeinnovation.co.za', company: 'Cape Innovation Labs', phone: '+27 (021) 456-7890', status: 'lead', createdAt: '2026-02-20T11:15:00Z', tags: ['startup', 'tech'] },
  { id: '5', name: 'Naledi van der Merwe', email: 'naledi.vdm@deloittesa.co.za', company: 'Deloitte SA Consulting', phone: '+27 (011) 567-8901', status: 'active', createdAt: '2026-01-20T13:00:00Z', tags: ['enterprise', 'consulting', 'high-value'] },
  { id: '6', name: 'Johan Pretorius', email: 'johan.p@cloudafrica.co.za', company: 'CloudAfrica Solutions', phone: '+27 (012) 678-9012', status: 'lead', createdAt: '2026-02-15T10:30:00Z', tags: ['tech', 'saas', 'mid-market'] },
  { id: '7', name: 'Lerato Khumalo', email: 'lerato@jhbcreative.co.za', company: 'Johannesburg Creative Agency', phone: '+27 (011) 789-0123', status: 'active', createdAt: '2026-01-25T14:00:00Z', tags: ['agency', 'creative', 'recurring'] },
  { id: '8', name: 'Pieter du Plessis', email: 'pieter.duplessis@shoprite.co.za', company: 'Shoprite Group', phone: '+27 (021) 890-1234', status: 'won', createdAt: '2025-12-10T09:00:00Z', tags: ['retail', 'enterprise', 'long-term'] },
  { id: '9', name: 'Ayanda Zulu', email: 'ayanda@medtechafrica.co.za', company: 'MedTech Africa', phone: '+27 (031) 901-2345', status: 'lead', createdAt: '2026-02-22T16:00:00Z', tags: ['healthcare', 'startup', 'urgent'] },
  { id: '10', name: 'Fatima Patel', email: 'fatima.patel@standardbank.co.za', company: 'Standard Bank', phone: '+27 (011) 012-3456', status: 'active', createdAt: '2026-02-05T11:00:00Z', tags: ['finance', 'enterprise', 'compliance'] },
  { id: '11', name: 'Werner Botha', email: 'werner@stellenbosch-edtech.co.za', company: 'Stellenbosch EdTech', phone: '+27 (021) 123-4568', status: 'lead', createdAt: '2026-02-18T15:30:00Z', tags: ['education', 'non-profit', 'mid-market'] },
  { id: '12', name: 'Nkosazana Mbeki', email: 'nkosazana.mbeki@samanufacturing.co.za', company: 'SA Manufacturing Holdings', phone: '+27 (011) 234-5679', status: 'lost', createdAt: '2026-01-10T10:00:00Z', tags: ['manufacturing', 'enterprise'] },
];

const initialActions: Action[] = [
  { id: '1', contactId: '1', type: 'call', description: 'Follow up on Q1 proposal discussion', dueDate: '2026-02-26T15:00:00Z', completed: false, createdAt: '2026-02-20T10:00:00Z' },
  { id: '2', contactId: '2', type: 'email', description: 'Send design package pricing', dueDate: '2026-02-25T09:00:00Z', completed: false, createdAt: '2026-02-18T14:00:00Z' },
  { id: '3', contactId: '3', type: 'meeting', description: 'Monthly review meeting', dueDate: '2026-02-28T14:00:00Z', completed: false, createdAt: '2026-02-15T11:00:00Z' },
  { id: '4', contactId: '1', type: 'follow-up', description: 'Check if contract was signed', dueDate: '2026-02-24T10:00:00Z', completed: true, completedAt: '2026-02-24T11:30:00Z', createdAt: '2026-02-22T09:00:00Z' },
  { id: '5', contactId: '4', type: 'task', description: 'Prepare demo for product showcase', dueDate: '2026-02-27T16:00:00Z', completed: false, createdAt: '2026-02-21T10:00:00Z' },
  { id: '6', contactId: '1', type: 'email', description: 'Send contract renewal terms', dueDate: '2026-03-05T10:00:00Z', completed: false, createdAt: '2026-02-23T09:00:00Z' },
  { id: '7', contactId: '3', type: 'call', description: 'Discuss Q2 marketing strategy', dueDate: '2026-03-01T11:00:00Z', completed: false, createdAt: '2026-02-24T14:00:00Z' },
  { id: '8', contactId: '2', type: 'meeting', description: 'Design kickoff meeting', dueDate: '2026-02-26T10:00:00Z', completed: false, createdAt: '2026-02-22T16:00:00Z' },
  { id: '9', contactId: '1', type: 'task', description: 'Send quarterly report', dueDate: '2026-02-25T17:00:00Z', completed: true, completedAt: '2026-02-25T16:45:00Z', createdAt: '2026-02-24T10:00:00Z' },
  { id: '10', contactId: '5', type: 'call', description: 'Initial discovery call to understand requirements', dueDate: '2026-02-26T14:00:00Z', completed: false, createdAt: '2026-02-20T11:00:00Z' },
  { id: '11', contactId: '6', type: 'email', description: 'Send product comparison sheet', dueDate: '2026-02-27T09:00:00Z', completed: false, createdAt: '2026-02-22T15:00:00Z' },
  { id: '12', contactId: '7', type: 'meeting', description: 'Review creative brief and timeline', dueDate: '2026-03-02T10:00:00Z', completed: false, createdAt: '2026-02-23T14:00:00Z' },
  { id: '13', contactId: '8', type: 'follow-up', description: 'Check satisfaction with recent delivery', dueDate: '2026-02-29T15:00:00Z', completed: false, createdAt: '2026-02-24T09:00:00Z' },
  { id: '14', contactId: '9', type: 'task', description: 'Research HIPAA compliance requirements', dueDate: '2026-02-26T16:00:00Z', completed: false, createdAt: '2026-02-23T10:00:00Z' },
  { id: '15', contactId: '10', type: 'call', description: 'Discuss security and compliance needs', dueDate: '2026-02-28T11:00:00Z', completed: false, createdAt: '2026-02-25T10:00:00Z' },
  { id: '16', contactId: '11', type: 'email', description: 'Send educational discount information', dueDate: '2026-03-03T09:00:00Z', completed: false, createdAt: '2026-02-24T16:00:00Z' },
  { id: '17', contactId: '5', type: 'follow-up', description: 'Follow up on proposal sent last week', dueDate: '2026-02-25T10:00:00Z', completed: true, completedAt: '2026-02-25T10:30:00Z', createdAt: '2026-02-18T14:00:00Z' },
  { id: '18', contactId: '7', type: 'call', description: 'Discuss renewal terms for annual contract', dueDate: '2026-03-04T14:00:00Z', completed: false, createdAt: '2026-02-25T11:00:00Z' },
  { id: '19', contactId: '4', type: 'email', description: 'Share case studies from similar startups', dueDate: '2026-02-27T11:00:00Z', completed: false, createdAt: '2026-02-23T09:00:00Z' },
  { id: '20', contactId: '6', type: 'meeting', description: 'Product demo and Q&A session', dueDate: '2026-03-01T15:00:00Z', completed: false, createdAt: '2026-02-24T13:00:00Z' },
];

const initialNotes: Note[] = [
  { id: '1', contactId: '1', content: 'Very interested in enterprise package. Decision maker, budget approved for Q1.', createdAt: '2026-02-20T10:30:00Z' },
  { id: '2', contactId: '2', content: 'Looking for full rebrand. Timeline: 3-4 months. Budget seems flexible.', createdAt: '2026-02-18T15:00:00Z' },
  { id: '3', contactId: '3', content: 'Renewed contract for another year. Very satisfied with service.', createdAt: '2026-02-15T12:00:00Z' },
  { id: '4', contactId: '5', content: 'Key decision maker for consulting group. Focuses on ROI and measurable results.', createdAt: '2026-02-20T11:30:00Z' },
  { id: '5', contactId: '5', content: 'Interested in multi-year contract. Mentioned they have budget for expansion.', createdAt: '2026-02-23T14:00:00Z' },
  { id: '6', contactId: '6', content: 'CTO of mid-sized tech company. Technical buyer, needs detailed specs.', createdAt: '2026-02-22T16:00:00Z' },
  { id: '7', contactId: '7', content: 'Creative director. Loves our portfolio. Price not a major concern.', createdAt: '2026-02-23T15:00:00Z' },
  { id: '8', contactId: '8', content: 'Great client! Always pays on time. Recently expanded to 5 new locations in Gauteng.', createdAt: '2026-02-24T10:00:00Z' },
  { id: '9', contactId: '9', content: 'Health tech startup based in Durban. POPIA compliance is critical requirement.', createdAt: '2026-02-23T11:00:00Z' },
  { id: '10', contactId: '10', content: 'Banking sector, very concerned about security and POPIA compliance. Needs SOC 2.', createdAt: '2026-02-25T11:00:00Z' },
  { id: '11', contactId: '11', content: 'Educational institution based in Stellenbosch. Budget cycle ends in June. Decision by committee.', createdAt: '2026-02-24T17:00:00Z' },
  { id: '12', contactId: '4', content: 'Fast-moving startup in Cape Town. Founder is hands-on. Quick decision maker.', createdAt: '2026-02-23T10:00:00Z' },
];

const initialDeals: Deal[] = [
  { id: '1', contactId: '1', title: 'Enterprise Package Deal', value: 900000, stage: 'proposal', probability: 80, expectedCloseDate: '2026-03-01T00:00:00Z', createdAt: '2026-02-20T10:00:00Z', updatedAt: '2026-02-20T10:00:00Z' },
  { id: '2', contactId: '2', title: 'Design Package Deal', value: 360000, stage: 'qualification', probability: 60, expectedCloseDate: '2026-03-15T00:00:00Z', createdAt: '2026-02-18T14:00:00Z', updatedAt: '2026-02-18T14:00:00Z' },
  { id: '3', contactId: '3', title: 'Marketing Package Deal', value: 540000, stage: 'negotiation', probability: 70, expectedCloseDate: '2026-03-10T00:00:00Z', createdAt: '2026-02-15T11:00:00Z', updatedAt: '2026-02-15T11:00:00Z' },
  { id: '4', contactId: '4', title: 'Startup Growth Package', value: 270000, stage: 'prospecting', probability: 40, expectedCloseDate: '2026-04-01T00:00:00Z', createdAt: '2026-02-21T10:00:00Z', updatedAt: '2026-02-21T10:00:00Z' },
  { id: '5', contactId: '1', title: 'Annual Support Contract', value: 450000, stage: 'closed-won', probability: 100, expectedCloseDate: '2026-02-15T00:00:00Z', createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-02-15T14:00:00Z' },
  { id: '6', contactId: '2', title: 'Website Redesign', value: 216000, stage: 'prospecting', probability: 50, expectedCloseDate: '2026-03-20T00:00:00Z', createdAt: '2026-02-22T11:00:00Z', updatedAt: '2026-02-22T11:00:00Z' },
  { id: '7', contactId: '5', title: 'Consulting Services Contract', value: 1530000, stage: 'proposal', probability: 75, expectedCloseDate: '2026-03-15T00:00:00Z', createdAt: '2026-02-20T12:00:00Z', updatedAt: '2026-02-23T15:00:00Z' },
  { id: '8', contactId: '6', title: 'SaaS Platform License', value: 810000, stage: 'qualification', probability: 55, expectedCloseDate: '2026-03-25T00:00:00Z', createdAt: '2026-02-22T15:30:00Z', updatedAt: '2026-02-22T15:30:00Z' },
  { id: '9', contactId: '7', title: 'Creative Retainer Agreement', value: 648000, stage: 'negotiation', probability: 85, expectedCloseDate: '2026-03-05T00:00:00Z', createdAt: '2026-02-23T14:30:00Z', updatedAt: '2026-02-24T11:00:00Z' },
  { id: '10', contactId: '8', title: 'Multi-Location Expansion', value: 2160000, stage: 'closed-won', probability: 100, expectedCloseDate: '2026-02-10T00:00:00Z', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-02-10T16:00:00Z' },
  { id: '11', contactId: '9', title: 'POPIA-Compliant Platform', value: 1170000, stage: 'qualification', probability: 50, expectedCloseDate: '2026-04-15T00:00:00Z', createdAt: '2026-02-23T11:00:00Z', updatedAt: '2026-02-23T11:00:00Z' },
  { id: '12', contactId: '10', title: 'Enterprise Security Solution', value: 1710000, stage: 'proposal', probability: 70, expectedCloseDate: '2026-03-30T00:00:00Z', createdAt: '2026-02-25T11:30:00Z', updatedAt: '2026-02-25T11:30:00Z' },
  { id: '13', contactId: '11', title: 'Educational Platform License', value: 504000, stage: 'prospecting', probability: 45, expectedCloseDate: '2026-05-01T00:00:00Z', createdAt: '2026-02-24T17:30:00Z', updatedAt: '2026-02-24T17:30:00Z' },
];

const initialEmailTemplates: EmailTemplate[] = [
  { id: '1', name: 'Initial Outreach', subject: 'Quick introduction - {{company}}', body: `Hi {{name}},\n\nI hope this email finds you well. I came across {{company}} and was impressed by your work in the industry.\n\nI'd love to schedule a brief call to explore how we might be able to help {{company}} achieve its goals.\n\nWould you be available for a 15-minute call this week?\n\nBest regards,\n[Your Name]`, category: 'introduction' },
  { id: '2', name: 'Follow-up After Meeting', subject: 'Great meeting you, {{name}}', body: `Hi {{name}},\n\nThank you for taking the time to meet with me today. I enjoyed learning more about {{company}}'s needs and goals.\n\nAs discussed, I'll send over the proposal by end of week. In the meantime, please don't hesitate to reach out if you have any questions.\n\nLooking forward to working together!\n\nBest regards,\n[Your Name]`, category: 'follow-up' },
  { id: '3', name: 'Proposal Follow-up', subject: 'Following up on proposal for {{company}}', body: `Hi {{name}},\n\nI wanted to follow up on the proposal I sent last week for {{company}}.\n\nHave you had a chance to review it? I'd be happy to schedule a call to discuss any questions or adjustments you might need.\n\nLooking forward to hearing your thoughts!\n\nBest regards,\n[Your Name]`, category: 'proposal' },
  { id: '4', name: 'Meeting Request', subject: 'Meeting request - {{company}}', body: `Hi {{name}},\n\nI'd love to schedule a meeting to discuss how we can help {{company}} with [specific challenge/opportunity].\n\nWould you be available for a 30-minute call next week? I'm flexible on timing.\n\nPlease let me know what works best for you.\n\nBest regards,\n[Your Name]`, category: 'meeting' },
  { id: '5', name: 'Check-in Email', subject: 'Checking in - {{company}}', body: `Hi {{name}},\n\nI hope you're doing well! I wanted to check in and see how things are going at {{company}}.\n\nIs there anything I can help with? I'm here if you need support or have any questions.\n\nBest regards,\n[Your Name]`, category: 'follow-up' },
  { id: '6', name: 'Closing Deal', subject: 'Next steps for {{company}}', body: `Hi {{name}},\n\nI'm excited to move forward with our partnership! \n\nI've prepared the contract and next steps. Could we schedule a quick call this week to finalize everything?\n\nLooking forward to getting started!\n\nBest regards,\n[Your Name]`, category: 'closing' },
];

// ─── Mutable State ─────────────────────────────────────────

let contacts: Contact[] = [...initialContacts];
let actions: Action[] = [...initialActions];
let notes: Note[] = [...initialNotes];
let deals: Deal[] = [...initialDeals];
let emailSequences: EmailSequence[] = [];
let workflowRules: WorkflowRule[] = [];
let salesGoals: SalesGoal[] = [];
let notifications: AppNotification[] = [];
let emailTemplates: EmailTemplate[] = [...initialEmailTemplates];

// ─── Contact CRUD ──────────────────────────────────────────

function createContact(data: Omit<Contact, 'id' | 'createdAt'>): Contact {
  const contact: Contact = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  contacts = [...contacts, contact];
  notify('contacts');
  return contact;
}

function updateContact(id: string, updates: Partial<Contact>): Contact | null {
  const index = contacts.findIndex(c => c.id === id);
  if (index === -1) return null;
  contacts[index] = { ...contacts[index], ...updates };
  contacts = [...contacts];
  notify('contacts');
  return contacts[index];
}

function deleteContact(id: string): boolean {
  const before = contacts.length;
  contacts = contacts.filter(c => c.id !== id);
  if (contacts.length < before) {
    // Cross-domain side effects
    actions = actions.filter(a => a.contactId !== id);
    notes = notes.filter(n => n.contactId !== id);
    deals = deals.filter(d => d.contactId !== id);
    notify('contacts');
    notify('actions');
    notify('notes');
    notify('deals');
    return true;
  }
  return false;
}

function bulkUpdateContacts(contactIds: string[], updates: Partial<Contact>): void {
  contacts = contacts.map(c =>
    contactIds.includes(c.id) ? { ...c, ...updates } : c
  );
  notify('contacts');
}

function bulkDeleteContacts(contactIds: string[]): void {
  contacts = contacts.filter(c => !contactIds.includes(c.id));
  actions = actions.filter(a => !contactIds.includes(a.contactId));
  notes = notes.filter(n => !contactIds.includes(n.contactId));
  deals = deals.filter(d => !contactIds.includes(d.contactId));
  notify('contacts');
  notify('actions');
  notify('notes');
  notify('deals');
}

// ─── Action CRUD ───────────────────────────────────────────

function createAction(data: Omit<Action, 'id' | 'createdAt'>): Action {
  const action: Action = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  actions = [...actions, action];
  notify('actions');
  return action;
}

function updateAction(id: string, updates: Partial<Action>): Action | null {
  const index = actions.findIndex(a => a.id === id);
  if (index === -1) return null;
  actions[index] = { ...actions[index], ...updates };
  actions = [...actions];
  notify('actions');
  return actions[index];
}

function deleteAction(id: string): boolean {
  const before = actions.length;
  actions = actions.filter(a => a.id !== id);
  if (actions.length < before) {
    notify('actions');
    return true;
  }
  return false;
}

function completeAction(id: string): Action | null {
  const index = actions.findIndex(a => a.id === id);
  if (index === -1) return null;
  actions[index] = {
    ...actions[index],
    completed: true,
    completedAt: new Date().toISOString(),
  };
  actions = [...actions];
  notify('actions');
  return actions[index];
}

// ─── Note CRUD ─────────────────────────────────────────────

function createNote(data: Omit<Note, 'id' | 'createdAt'>): Note {
  const note: Note = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  notes = [...notes, note];
  notify('notes');
  return note;
}

function deleteNote(id: string): boolean {
  const before = notes.length;
  notes = notes.filter(n => n.id !== id);
  if (notes.length < before) {
    notify('notes');
    return true;
  }
  return false;
}

// ─── Deal CRUD ─────────────────────────────────────────────

function createDeal(data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Deal {
  const now = new Date().toISOString();
  const deal: Deal = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  deals = [...deals, deal];
  notify('deals');
  return deal;
}

function updateDeal(id: string, updates: Partial<Deal>): Deal | null {
  const index = deals.findIndex(d => d.id === id);
  if (index === -1) return null;
  deals[index] = { ...deals[index], ...updates, updatedAt: new Date().toISOString() };
  deals = [...deals];
  notify('deals');
  return deals[index];
}

function deleteDeal(id: string): boolean {
  const before = deals.length;
  deals = deals.filter(d => d.id !== id);
  if (deals.length < before) {
    notify('deals');
    return true;
  }
  return false;
}

// ─── Email Sequence CRUD ───────────────────────────────────

function createEmailSequence(data: Omit<EmailSequence, 'id' | 'createdAt'>): EmailSequence {
  const seq: EmailSequence = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  emailSequences = [...emailSequences, seq];
  notify('emailSequences');
  return seq;
}

function updateEmailSequence(id: string, updates: Partial<EmailSequence>): EmailSequence | null {
  const index = emailSequences.findIndex(s => s.id === id);
  if (index === -1) return null;
  emailSequences[index] = { ...emailSequences[index], ...updates };
  emailSequences = [...emailSequences];
  notify('emailSequences');
  return emailSequences[index];
}

function deleteEmailSequence(id: string): boolean {
  const before = emailSequences.length;
  emailSequences = emailSequences.filter(s => s.id !== id);
  if (emailSequences.length < before) {
    notify('emailSequences');
    return true;
  }
  return false;
}

// ─── Workflow Rule CRUD ────────────────────────────────────

function createWorkflowRule(data: Omit<WorkflowRule, 'id' | 'createdAt'>): WorkflowRule {
  const rule: WorkflowRule = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  workflowRules = [...workflowRules, rule];
  notify('workflowRules');
  return rule;
}

function updateWorkflowRule(id: string, updates: Partial<WorkflowRule>): WorkflowRule | null {
  const index = workflowRules.findIndex(r => r.id === id);
  if (index === -1) return null;
  workflowRules[index] = { ...workflowRules[index], ...updates };
  workflowRules = [...workflowRules];
  notify('workflowRules');
  return workflowRules[index];
}

function deleteWorkflowRule(id: string): boolean {
  const before = workflowRules.length;
  workflowRules = workflowRules.filter(r => r.id !== id);
  if (workflowRules.length < before) {
    notify('workflowRules');
    return true;
  }
  return false;
}

// ─── Sales Goal CRUD ───────────────────────────────────────

function createSalesGoal(data: Omit<SalesGoal, 'id'>): SalesGoal {
  const goal: SalesGoal = {
    ...data,
    id: generateId(),
  };
  salesGoals = [...salesGoals, goal];
  notify('salesGoals');
  return goal;
}

function updateSalesGoal(id: string, updates: Partial<SalesGoal>): SalesGoal | null {
  const index = salesGoals.findIndex(g => g.id === id);
  if (index === -1) return null;
  salesGoals[index] = { ...salesGoals[index], ...updates };
  salesGoals = [...salesGoals];
  notify('salesGoals');
  return salesGoals[index];
}

function deleteSalesGoal(id: string): boolean {
  const before = salesGoals.length;
  salesGoals = salesGoals.filter(g => g.id !== id);
  if (salesGoals.length < before) {
    notify('salesGoals');
    return true;
  }
  return false;
}

// ─── Notification CRUD ─────────────────────────────────────

function markNotificationRead(id: string): AppNotification | null {
  const index = notifications.findIndex(n => n.id === id);
  if (index === -1) return null;
  notifications[index] = { ...notifications[index], read: true };
  notifications = [...notifications];
  notify('notifications');
  return notifications[index];
}

function clearAllNotifications(): void {
  notifications = notifications.map(n => ({ ...n, read: true }));
  notify('notifications');
}

// ─── Email Template CRUD ───────────────────────────────────

function createEmailTemplate(data: Omit<EmailTemplate, 'id'>): EmailTemplate {
  const template: EmailTemplate = {
    ...data,
    id: generateId(),
  };
  emailTemplates = [...emailTemplates, template];
  notify('emailTemplates');
  return template;
}

function updateEmailTemplate(id: string, updates: Partial<EmailTemplate>): EmailTemplate | null {
  const index = emailTemplates.findIndex(t => t.id === id);
  if (index === -1) return null;
  emailTemplates[index] = { ...emailTemplates[index], ...updates };
  emailTemplates = [...emailTemplates];
  notify('emailTemplates');
  return emailTemplates[index];
}

function deleteEmailTemplate(id: string): boolean {
  const before = emailTemplates.length;
  emailTemplates = emailTemplates.filter(t => t.id !== id);
  if (emailTemplates.length < before) {
    notify('emailTemplates');
    return true;
  }
  return false;
}

// ─── Computed Getters ──────────────────────────────────────

function checkForDuplicates(email: string): Contact | null {
  return contacts.find(c => c.email.toLowerCase() === email.toLowerCase()) || null;
}

function calculateLeadScore(contactId: string): number {
  const contact = contacts.find(c => c.id === contactId);
  if (!contact) return 0;
  let score = 0;
  if (contact.status === 'lead') score += 10;
  if (contact.tags.includes('high-priority')) score += 20;
  if (contact.tags.includes('enterprise')) score += 15;
  return score;
}

function getLeadSourceStats(): LeadSourceStats[] {
  const stats: Record<string, { count: number; totalValue: number }> = {};
  contacts.forEach(contact => {
    if (contact.leadSource) {
      if (!stats[contact.leadSource]) {
        stats[contact.leadSource] = { count: 0, totalValue: 0 };
      }
      stats[contact.leadSource].count += 1;
      const deal = deals.find(d => d.contactId === contact.id);
      if (deal && deal.stage === 'closed-won') {
        stats[contact.leadSource].totalValue += deal.value;
      }
    }
  });
  return Object.keys(stats).map(source => ({
    source,
    count: stats[source].count,
    conversionRate: stats[source].totalValue > 0 ? 100 : 0,
    totalValue: stats[source].totalValue,
  }));
}

function getContactById(id: string): Contact | undefined {
  return contacts.find(c => c.id === id);
}

function getActionsByContact(contactId: string): Action[] {
  return actions.filter(a => a.contactId === contactId);
}

function getNotesByContact(contactId: string): Note[] {
  return notes.filter(n => n.contactId === contactId);
}

function getDealsByContact(contactId: string): Deal[] {
  return deals.filter(d => d.contactId === contactId);
}

// ─── Public API ────────────────────────────────────────────

export const appStore = {
  // Reactive state (read by hooks)
  get contacts() { return contacts; },
  get actions() { return actions; },
  get notes() { return notes; },
  get deals() { return deals; },
  get emailSequences() { return emailSequences; },
  get workflowRules() { return workflowRules; },
  get salesGoals() { return salesGoals; },
  get notifications() { return notifications; },
  get emailTemplates() { return emailTemplates; },

  // Computed
  get unreadNotificationCount() { return notifications.filter(n => !n.read).length; },

  // Read helpers
  getContactById,
  getActionsByContact,
  getNotesByContact,
  getDealsByContact,
  checkForDuplicates,
  calculateLeadScore,
  getLeadSourceStats,

  // Mutations (called by API layer only)
  createContact,
  updateContact,
  deleteContact,
  bulkUpdateContacts,
  bulkDeleteContacts,
  createAction,
  updateAction,
  deleteAction,
  completeAction,
  createNote,
  deleteNote,
  createDeal,
  updateDeal,
  deleteDeal,
  createEmailSequence,
  updateEmailSequence,
  deleteEmailSequence,
  createWorkflowRule,
  updateWorkflowRule,
  deleteWorkflowRule,
  createSalesGoal,
  updateSalesGoal,
  deleteSalesGoal,
  markNotificationRead,
  clearAllNotifications,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,

  // Pub/sub
  subscribe(slice: Slice, listener: Listener): () => void {
    subscribers[slice].add(listener);
    return () => subscribers[slice].delete(listener);
  },
};