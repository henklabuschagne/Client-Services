import { appStore } from '../appStore';
import { mockApiCall, errorResponse } from './config';
import type { ApiResult } from './types';
import type { Contact, LeadSourceStats } from '../appStore';

export async function createContact(data: Omit<Contact, 'id' | 'createdAt'>): Promise<ApiResult<Contact>> {
  if (!data.name.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Contact name is required');
  }
  if (!data.email.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Email is required');
  }
  return mockApiCall(() => appStore.createContact(data));
}

export async function updateContact(id: string, data: Partial<Contact>): Promise<ApiResult<Contact>> {
  return mockApiCall(() => {
    const result = appStore.updateContact(id, data);
    if (!result) throw new Error(`Contact ${id} not found`);
    return result;
  });
}

export async function deleteContact(id: string): Promise<ApiResult<boolean>> {
  return mockApiCall(() => {
    const result = appStore.deleteContact(id);
    if (!result) throw new Error(`Contact ${id} not found`);
    return result;
  });
}

export async function bulkUpdateContacts(contactIds: string[], updates: Partial<Contact>): Promise<ApiResult<void>> {
  return mockApiCall(() => appStore.bulkUpdateContacts(contactIds, updates));
}

export async function bulkDeleteContacts(contactIds: string[]): Promise<ApiResult<void>> {
  return mockApiCall(() => appStore.bulkDeleteContacts(contactIds));
}

export async function checkForDuplicates(email: string): Promise<ApiResult<Contact | null>> {
  return mockApiCall(() => appStore.checkForDuplicates(email));
}

export async function calculateLeadScore(contactId: string): Promise<ApiResult<number>> {
  return mockApiCall(() => appStore.calculateLeadScore(contactId));
}

export async function getLeadSourceStats(): Promise<ApiResult<LeadSourceStats[]>> {
  return mockApiCall(() => appStore.getLeadSourceStats());
}
