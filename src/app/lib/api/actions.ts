import { appStore } from '../appStore';
import { mockApiCall, errorResponse } from './config';
import type { ApiResult } from './types';
import type { Action } from '../appStore';

export async function createAction(data: Omit<Action, 'id' | 'createdAt'>): Promise<ApiResult<Action>> {
  if (!data.description.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Action description is required');
  }
  return mockApiCall(() => appStore.createAction(data));
}

export async function updateAction(id: string, data: Partial<Action>): Promise<ApiResult<Action>> {
  return mockApiCall(() => {
    const result = appStore.updateAction(id, data);
    if (!result) throw new Error(`Action ${id} not found`);
    return result;
  });
}

export async function deleteAction(id: string): Promise<ApiResult<boolean>> {
  return mockApiCall(() => {
    const result = appStore.deleteAction(id);
    if (!result) throw new Error(`Action ${id} not found`);
    return result;
  });
}

export async function completeAction(id: string): Promise<ApiResult<Action>> {
  return mockApiCall(() => {
    const result = appStore.completeAction(id);
    if (!result) throw new Error(`Action ${id} not found`);
    return result;
  });
}
