import * as contacts from './contacts';
import * as actions from './actions';
import * as notes from './notes';
import * as deals from './deals';
import * as automation from './automation';
import * as goals from './goals';
import * as notifications from './notifications';
import * as emailTemplates from './emailTemplates';

export const api = {
  contacts,
  actions,
  notes,
  deals,
  automation,
  goals,
  notifications,
  emailTemplates,
};

export type { ApiResult, ApiError, PaginatedResult } from './types';
