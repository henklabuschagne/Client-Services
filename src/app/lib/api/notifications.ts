import { appStore } from '../appStore';
import { mockApiCall } from './config';
import type { ApiResult } from './types';
import type { AppNotification } from '../appStore';

export async function markNotificationRead(id: string): Promise<ApiResult<AppNotification>> {
  return mockApiCall(() => {
    const result = appStore.markNotificationRead(id);
    if (!result) throw new Error(`Notification ${id} not found`);
    return result;
  });
}

export async function clearAllNotifications(): Promise<ApiResult<void>> {
  return mockApiCall(() => appStore.clearAllNotifications());
}
