export interface CommanderTemplate {
  name: string;
  originRegion: 'africa' | 'americas' | 'asia' | 'europe' | 'oceania';
  baseAttributes: {
    attack: number;
    defense: number;
    mobility: number;
    leadership: number;
  };
  skillCards: Array<{
    id: string;
    name: string;
    trigger: string;
    modifier: string;
    cooldownMs: number;
    durationMs: number;
  }>;
}

export const commandersPool: CommanderTemplate[] = [
  {
    name: '拿破仑',
    originRegion: 'europe',
    baseAttributes: { attack: 90, defense: 75, mobility: 85, leadership: 92 },
    skillCards: [
      {
        id: 'napoleon-grand-army',
        name: '大军团',
        trigger: 'on_attack',
        modifier: '+20% attack',
        cooldownMs: 180000,
        durationMs: 60000,
      },
    ],
  },
  {
    name: '秦始皇',
    originRegion: 'asia',
    baseAttributes: { attack: 85, defense: 88, mobility: 70, leadership: 95 },
    skillCards: [
      {
        id: 'qin-great-wall',
        name: '长城防御',
        trigger: 'on_defend',
        modifier: '+30% defense',
        cooldownMs: 240000,
        durationMs: 90000,
      },
    ],
  },
  {
    name: '克娄巴特拉',
    originRegion: 'africa',
    baseAttributes: { attack: 75, defense: 80, mobility: 82, leadership: 88 },
    skillCards: [
      {
        id: 'cleopatra-diplomacy',
        name: '外交联盟',
        trigger: 'on_alliance',
        modifier: '+15% all_stats',
        cooldownMs: 300000,
        durationMs: 120000,
      },
    ],
  },
  {
    name: '成吉思汗',
    originRegion: 'asia',
    baseAttributes: { attack: 95, defense: 70, mobility: 98, leadership: 90 },
    skillCards: [
      {
        id: 'genghis-cavalry',
        name: '骑兵突袭',
        trigger: 'on_attack',
        modifier: '+25% mobility',
        cooldownMs: 150000,
        durationMs: 45000,
      },
    ],
  },
  {
    name: '亚历山大大帝',
    originRegion: 'europe',
    baseAttributes: { attack: 92, defense: 78, mobility: 88, leadership: 94 },
    skillCards: [
      {
        id: 'alexander-phalanx',
        name: '方阵',
        trigger: 'on_battle',
        modifier: '+18% attack_defense',
        cooldownMs: 200000,
        durationMs: 70000,
      },
    ],
  },
  {
    name: '朱利叶斯·凯撒',
    originRegion: 'europe',
    baseAttributes: { attack: 88, defense: 82, mobility: 80, leadership: 91 },
    skillCards: [
      {
        id: 'caesar-legion',
        name: '罗马军团',
        trigger: 'on_attack',
        modifier: '+22% attack',
        cooldownMs: 190000,
        durationMs: 65000,
      },
    ],
  },
  {
    name: '圣女贞德',
    originRegion: 'europe',
    baseAttributes: { attack: 82, defense: 85, mobility: 78, leadership: 93 },
    skillCards: [
      {
        id: 'joan-inspiration',
        name: '神圣鼓舞',
        trigger: 'on_defend',
        modifier: '+25% morale',
        cooldownMs: 210000,
        durationMs: 80000,
      },
    ],
  },
  {
    name: '西蒙·玻利瓦尔',
    originRegion: 'americas',
    baseAttributes: { attack: 80, defense: 76, mobility: 84, leadership: 86 },
    skillCards: [
      {
        id: 'bolivar-liberation',
        name: '解放军',
        trigger: 'on_liberate',
        modifier: '+20% mobility',
        cooldownMs: 220000,
        durationMs: 75000,
      },
    ],
  },
  {
    name: '阿提拉',
    originRegion: 'asia',
    baseAttributes: { attack: 93, defense: 72, mobility: 90, leadership: 85 },
    skillCards: [
      {
        id: 'attila-horde',
        name: '匈奴铁骑',
        trigger: 'on_attack',
        modifier: '+28% attack',
        cooldownMs: 170000,
        durationMs: 55000,
      },
    ],
  },
  {
    name: '萨拉丁',
    originRegion: 'africa',
    baseAttributes: { attack: 86, defense: 84, mobility: 82, leadership: 89 },
    skillCards: [
      {
        id: 'saladin-honor',
        name: '骑士精神',
        trigger: 'on_defend',
        modifier: '+20% defense',
        cooldownMs: 200000,
        durationMs: 70000,
      },
    ],
  },
  {
    name: '武则天',
    originRegion: 'asia',
    baseAttributes: { attack: 78, defense: 88, mobility: 75, leadership: 96 },
    skillCards: [
      {
        id: 'wuzetian-intrigue',
        name: '权谋',
        trigger: 'on_alliance',
        modifier: '+30% leadership',
        cooldownMs: 250000,
        durationMs: 100000,
      },
    ],
  },
  {
    name: '乔治·华盛顿',
    originRegion: 'americas',
    baseAttributes: { attack: 82, defense: 85, mobility: 77, leadership: 90 },
    skillCards: [
      {
        id: 'washington-revolution',
        name: '革命精神',
        trigger: 'on_defend',
        modifier: '+23% defense',
        cooldownMs: 230000,
        durationMs: 85000,
      },
    ],
  },
];

export function getRandomCommanders(count: number, seed: number): CommanderTemplate[] {
  const rng = seedRandom(seed);
  const shuffled = [...commandersPool].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

function seedRandom(seed: number) {
  let current = seed;
  return function () {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}
