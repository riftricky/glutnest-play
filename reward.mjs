import { SHOP } from './game.mjs'

const FIRST_MISSION_ID = 'glutfeld'
export const FIRST_REWARD_ID = 'moss-cushion'

const firstReward = SHOP.find(item => item.id === FIRST_REWARD_ID)

export function firstRewardAction(state) {
  const round = state?.round
  if (round?.missionId !== FIRST_MISSION_ID || round.status !== 'won') return null
  if (state.progress?.wins?.includes(FIRST_MISSION_ID) !== true) return null
  if (state.equipped?.includes(FIRST_REWARD_ID)) return null
  return { itemId: FIRST_REWARD_ID, label: 'Mooskissen fürs Nest' }
}

export function rewardItemAction(state, itemId) {
  if (itemId !== FIRST_REWARD_ID) return null
  if (state?.equipped?.includes(itemId)) return { itemId, action: 'view', label: 'Im Nest ansehen' }
  if (state?.owned?.includes(itemId)) return { itemId, action: 'equip', label: 'Aufstellen' }
  return {
    itemId,
    action: 'buy',
    label: 'Freischalten',
    cost: firstReward.cost,
    affordable: state?.glow >= firstReward.cost,
  }
}
