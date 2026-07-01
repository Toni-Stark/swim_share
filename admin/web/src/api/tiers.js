import request from './request';

export function getTierDistribution() {
  return request.get('/tiers');
}

export function getDiamondUsers() {
  return request.get('/tiers/diamond');
}

export default { getTierDistribution, getDiamondUsers };
