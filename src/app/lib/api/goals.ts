import { appStore } from '../appStore';
import { mockApiCall, errorResponse } from './config';
import type { ApiResult } from './types';
import type { SalesGoal } from '../appStore';

export async function createSalesGoal(data: Omit<SalesGoal, 'id'>): Promise<ApiResult<SalesGoal>> {
  if (!data.name.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Goal name is required');
  }
  return mockApiCall(() => appStore.createSalesGoal(data));
}

export async function updateSalesGoal(id: string, data: Partial<SalesGoal>): Promise<ApiResult<SalesGoal>> {
  return mockApiCall(() => {
    const result = appStore.updateSalesGoal(id, data);
    if (!result) throw new Error(`Sales goal ${id} not found`);
    return result;
  });
}

export async function deleteSalesGoal(id: string): Promise<ApiResult<boolean>> {
  return mockApiCall(() => {
    const result = appStore.deleteSalesGoal(id);
    if (!result) throw new Error(`Sales goal ${id} not found`);
    return result;
  });
}
