import { appStore } from '../appStore';
import { mockApiCall, errorResponse } from './config';
import type { ApiResult } from './types';
import type { Deal } from '../appStore';

export async function createDeal(data: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResult<Deal>> {
  if (!data.title.trim()) {
    return errorResponse('VALIDATION_ERROR', 'Deal title is required');
  }
  return mockApiCall(() => appStore.createDeal(data));
}

export async function updateDeal(id: string, data: Partial<Deal>): Promise<ApiResult<Deal>> {
  return mockApiCall(() => {
    const result = appStore.updateDeal(id, data);
    if (!result) throw new Error(`Deal ${id} not found`);
    return result;
  });
}

export async function deleteDeal(id: string): Promise<ApiResult<boolean>> {
  return mockApiCall(() => {
    const result = appStore.deleteDeal(id);
    if (!result) throw new Error(`Deal ${id} not found`);
    return result;
  });
}
