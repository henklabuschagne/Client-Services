import { useState, useEffect, useMemo } from 'react';
import { appStore } from '../lib/appStore';
import { api } from '../lib/api';
import type { Slice } from '../lib/appStore';

export function useAppStore(...subscribeTo: Slice[]) {
  // Force re-render when subscribed slices change
  const [, bump] = useState(0);

  useEffect(() => {
    const unsubscribes = subscribeTo.map(slice =>
      appStore.subscribe(slice, () => bump(v => v + 1))
    );
    return () => unsubscribes.forEach(unsub => unsub());
    // subscribeTo is static per component call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Reactive State ──────────────────────────────────────
  const contacts = appStore.contacts;
  const actions = appStore.actions;
  const notes = appStore.notes;
  const deals = appStore.deals;
  const emailSequences = appStore.emailSequences;
  const workflowRules = appStore.workflowRules;
  const salesGoals = appStore.salesGoals;
  const notifications = appStore.notifications;
  const emailTemplates = appStore.emailTemplates;
  const unreadNotificationCount = appStore.unreadNotificationCount;

  // ─── Sync Read Helpers ───────────────────────────────────
  const reads = useMemo(() => ({
    getContactById: (id: string) => appStore.getContactById(id),
    getActionsByContact: (contactId: string) => appStore.getActionsByContact(contactId),
    getNotesByContact: (contactId: string) => appStore.getNotesByContact(contactId),
    getDealsByContact: (contactId: string) => appStore.getDealsByContact(contactId),
    checkForDuplicates: (email: string) => appStore.checkForDuplicates(email),
    calculateLeadScore: (contactId: string) => appStore.calculateLeadScore(contactId),
    getLeadSourceStats: () => appStore.getLeadSourceStats(),
  }), []);

  // ─── Async Actions (routed through API layer) ────────────
  const storeActions = useMemo(() => ({
    // Contacts
    createContact: api.contacts.createContact,
    updateContact: api.contacts.updateContact,
    deleteContact: api.contacts.deleteContact,
    bulkUpdateContacts: api.contacts.bulkUpdateContacts,
    bulkDeleteContacts: api.contacts.bulkDeleteContacts,

    // Actions
    createAction: api.actions.createAction,
    updateAction: api.actions.updateAction,
    deleteAction: api.actions.deleteAction,
    completeAction: api.actions.completeAction,

    // Notes
    createNote: api.notes.createNote,
    deleteNote: api.notes.deleteNote,

    // Deals
    createDeal: api.deals.createDeal,
    updateDeal: api.deals.updateDeal,
    deleteDeal: api.deals.deleteDeal,

    // Automation
    createEmailSequence: api.automation.createEmailSequence,
    updateEmailSequence: api.automation.updateEmailSequence,
    deleteEmailSequence: api.automation.deleteEmailSequence,
    createWorkflowRule: api.automation.createWorkflowRule,
    updateWorkflowRule: api.automation.updateWorkflowRule,
    deleteWorkflowRule: api.automation.deleteWorkflowRule,

    // Goals
    createSalesGoal: api.goals.createSalesGoal,
    updateSalesGoal: api.goals.updateSalesGoal,
    deleteSalesGoal: api.goals.deleteSalesGoal,

    // Notifications
    markNotificationRead: api.notifications.markNotificationRead,
    clearAllNotifications: api.notifications.clearAllNotifications,

    // Email Templates
    createEmailTemplate: api.emailTemplates.createEmailTemplate,
    updateEmailTemplate: api.emailTemplates.updateEmailTemplate,
    deleteEmailTemplate: api.emailTemplates.deleteEmailTemplate,
  }), []);

  return {
    // Reactive state
    contacts,
    actions,
    notes,
    deals,
    emailSequences,
    workflowRules,
    salesGoals,
    notifications,
    emailTemplates,
    unreadNotificationCount,
    // Sync reads
    reads,
    // Async writes
    storeActions,
  };
}
