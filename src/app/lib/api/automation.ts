import { appStore } from '../appStore';
import { mockApiCall, errorResponse } from './config';
import type { ApiResult } from './types';
import type { EmailSequence, WorkflowRule } from '../appStore';

// ─── Email Sequences ──────────────────────────────────────

export async function createEmailSequence(data: Omit<EmailSequence, 'id' | 'createdAt'>): Promise<ApiResult<EmailSequence>> {
  if (!data.name.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Sequence name is required');
  }
  return mockApiCall(() => appStore.createEmailSequence(data));
}

export async function updateEmailSequence(id: string, data: Partial<EmailSequence>): Promise<ApiResult<EmailSequence>> {
  return mockApiCall(() => {
    const result = appStore.updateEmailSequence(id, data);
    if (!result) throw new Error(`Email sequence ${id} not found`);
    return result;
  });
}

export async function deleteEmailSequence(id: string): Promise<ApiResult<boolean>> {
  return mockApiCall(() => {
    const result = appStore.deleteEmailSequence(id);
    if (!result) throw new Error(`Email sequence ${id} not found`);
    return result;
  });
}

// ─── Workflow Rules ───────────────────────────────────────

export async function createWorkflowRule(data: Omit<WorkflowRule, 'id' | 'createdAt'>): Promise<ApiResult<WorkflowRule>> {
  if (!data.name.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Workflow name is required');
  }
  return mockApiCall(() => appStore.createWorkflowRule(data));
}

export async function updateWorkflowRule(id: string, data: Partial<WorkflowRule>): Promise<ApiResult<WorkflowRule>> {
  return mockApiCall(() => {
    const result = appStore.updateWorkflowRule(id, data);
    if (!result) throw new Error(`Workflow rule ${id} not found`);
    return result;
  });
}

export async function deleteWorkflowRule(id: string): Promise<ApiResult<boolean>> {
  return mockApiCall(() => {
    const result = appStore.deleteWorkflowRule(id);
    if (!result) throw new Error(`Workflow rule ${id} not found`);
    return result;
  });
}
