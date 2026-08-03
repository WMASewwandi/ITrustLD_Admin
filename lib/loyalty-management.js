import { apiRequest } from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

function withToken(options = {}) {
  return { ...options, token: getAdminToken() };
}

export async function fetchLoyaltyManagementConfigs(audience = 'standard') {
  const params = new URLSearchParams({ audience });
  return apiRequest(`/admin/loyalty/management/configs?${params.toString()}`, withToken());
}

export async function updateMasterConfigState({ identifier, activationState }) {
  return apiRequest(
    '/admin/loyalty/management/master-config/state',
    withToken({
      method: 'POST',
      body: {
        identifier,
        activation_state: activationState,
      },
    }),
  );
}

export async function createPointCollection({ calAmount, isAffiliate }) {
  return apiRequest(
    '/admin/loyalty/management/point-collections',
    withToken({
      method: 'POST',
      body: {
        pointcollection_cal_amount: calAmount,
        pointcollection_is_affiliate: isAffiliate,
      },
    }),
  );
}

export async function updatePointCollectionAmount({ id, calAmount }) {
  return apiRequest(
    '/admin/loyalty/management/point-collections/amount',
    withToken({
      method: 'POST',
      body: {
        pointcollection_id: id,
        pointcollection_cal_amount: calAmount,
      },
    }),
  );
}

export async function updatePointCollectionState({ id, activationState }) {
  return apiRequest(
    '/admin/loyalty/management/point-collections/state',
    withToken({
      method: 'POST',
      body: {
        pointcollection_id: id,
        pointcollection_activation_state: activationState,
      },
    }),
  );
}

export async function deletePointCollection({ id }) {
  return apiRequest(
    '/admin/loyalty/management/point-collections/delete',
    withToken({
      method: 'POST',
      body: { pointcollection_id: id },
    }),
  );
}

export async function createBonus({ bonusAmount, isAffiliate }) {
  return apiRequest(
    '/admin/loyalty/management/bonuses',
    withToken({
      method: 'POST',
      body: {
        bonus_amount: bonusAmount,
        bonus_is_affiliate: isAffiliate,
      },
    }),
  );
}

export async function updateBonusAmount({ id, bonusAmount }) {
  return apiRequest(
    '/admin/loyalty/management/bonuses/amount',
    withToken({
      method: 'POST',
      body: {
        bonus_id: id,
        bonus_amount: bonusAmount,
      },
    }),
  );
}

export async function updateBonusState({ id, activationState }) {
  return apiRequest(
    '/admin/loyalty/management/bonuses/state',
    withToken({
      method: 'POST',
      body: {
        bonus_id: id,
        bonus_activation_state: activationState,
      },
    }),
  );
}

export async function deleteBonus({ id }) {
  return apiRequest(
    '/admin/loyalty/management/bonuses/delete',
    withToken({
      method: 'POST',
      body: { bonus_id: id },
    }),
  );
}

export async function createLoyaltyLevel({ clientBonusAmount, clientCount, loyaltyLevel }) {
  return apiRequest(
    '/admin/loyalty/management/loyalty-levels',
    withToken({
      method: 'POST',
      body: {
        client_bonus_amount: clientBonusAmount,
        client_count: clientCount,
        loyalty_level: loyaltyLevel,
      },
    }),
  );
}

export async function updateLoyaltyLevelAmount({ id, clientBonusAmount, clientCount }) {
  return apiRequest(
    '/admin/loyalty/management/loyalty-levels/amount',
    withToken({
      method: 'POST',
      body: {
        loyalty_level_id: id,
        client_bonus_amount: clientBonusAmount,
        client_count: clientCount,
      },
    }),
  );
}

export async function updateLoyaltyLevelState({ id, activationState }) {
  return apiRequest(
    '/admin/loyalty/management/loyalty-levels/state',
    withToken({
      method: 'POST',
      body: {
        loyalty_level_id: id,
        activation_state: activationState,
      },
    }),
  );
}

export async function deleteLoyaltyLevel({ id }) {
  return apiRequest(
    '/admin/loyalty/management/loyalty-levels/delete',
    withToken({
      method: 'POST',
      body: { loyalty_level_id: id },
    }),
  );
}
