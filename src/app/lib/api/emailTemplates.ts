import { appStore } from '../appStore';
import { mockApiCall, errorResponse } from './config';
import type { ApiResult } from './types';
import type { EmailTemplate } from '../appStore';

export async function createEmailTemplate(data: Omit<EmailTemplate, 'id'>): Promise<ApiResult<EmailTemplate>> {
  if (!data.name.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Template name is required');
  }
  return mockApiCall(() => appStore.createEmailTemplate(data));
}

export async function updateEmailTemplate(id: string, data: Partial<EmailTemplate>): Promise<ApiResult<EmailTemplate>> {
  return mockApiCall(() => {
    const result = appStore.updateEmailTemplate(id, data);
    if (!result) throw new Error(`Email template ${id} not found`);
    return result;
  });
}

export async function deleteEmailTemplate(id: string): Promise<ApiResult<boolean>> {
  return mockApiCall(() => {
    const result = appStore.deleteEmailTemplate(id);
    if (!result) throw new Error(`Email template ${id} not found`);
    return result;
  });
}
