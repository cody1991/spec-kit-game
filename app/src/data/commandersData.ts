export interface CommanderTemplate {
  id: string;
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
  // Visual representation for map
  colorMapping?: {
    primary: number;
    secondary: number;
    alpha: number;
    pattern?: string;
    label?: string;
    glowColor?: number;
    pulseSpeed?: number;
  };
}

export const commandersPool: CommanderTemplate[] = [
  {
    id: 'napoleon',
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
    colorMapping: {
      primary: 0x0066cc, // French Blue
      secondary: 0x003d7a,
      alpha: 0.7,
      pattern: 'stripes',
      label: '拿',
      glowColor: 0x0088ff,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'qin-shi-huang',
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
    colorMapping: {
      primary: 0xcc0000, // Chinese Red
      secondary: 0x7a0000,
      alpha: 0.7,
      pattern: 'dots',
      label: '秦',
      glowColor: 0xff0000,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'cleopatra',
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
    colorMapping: {
      primary: 0xffcc00, // Egyptian Gold
      secondary: 0xb8860b,
      alpha: 0.7,
      pattern: 'waves',
      label: '克',
      glowColor: 0xffdd00,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'genghis-khan',
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
    colorMapping: {
      primary: 0x008800, // Steppe Green
      secondary: 0x004d00,
      alpha: 0.7,
      pattern: 'triangles',
      label: '成',
      glowColor: 0x00aa00,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'alexander',
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
    colorMapping: {
      primary: 0x9933ff, // Royal Purple
      secondary: 0x5b1f99,
      alpha: 0.7,
      pattern: 'grid',
      label: '亚',
      glowColor: 0xaa44ff,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'caesar',
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
    colorMapping: {
      primary: 0xff6600, // Roman Orange
      secondary: 0xb84700,
      alpha: 0.7,
      pattern: 'circles',
      label: '凯',
      glowColor: 0xff7700,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'joan',
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
    colorMapping: {
      primary: 0xffffff, // Holy White
      secondary: 0xcccccc,
      alpha: 0.7,
      pattern: 'crosses',
      label: '贞',
      glowColor: 0xffffff,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'bolivar',
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
    colorMapping: {
      primary: 0x00aaaa, // Liberation Teal
      secondary: 0x006666,
      alpha: 0.7,
      pattern: 'stars',
      label: '玻',
      glowColor: 0x00cccc,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'attila',
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
    colorMapping: {
      primary: 0x663300, // Hun Brown
      secondary: 0x3d1f00,
      alpha: 0.7,
      pattern: 'crosses',
      label: '阿',
      glowColor: 0x884400,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'saladin',
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
    colorMapping: {
      primary: 0x00aa88, // Arabic Cyan
      secondary: 0x006655,
      alpha: 0.7,
      pattern: 'diamonds',
      label: '萨',
      glowColor: 0x00cc99,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'wuzetian',
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
    colorMapping: {
      primary: 0xff0066, // Imperial Rose
      secondary: 0x99003d,
      alpha: 0.7,
      pattern: 'hexagons',
      label: '武',
      glowColor: 0xff0077,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'washington',
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
    colorMapping: {
      primary: 0x666666, // Iron Gray
      secondary: 0x333333,
      alpha: 0.7,
      pattern: 'checkers',
      label: '华',
      glowColor: 0x888888,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'hannibal',
    name: '汉尼拔',
    originRegion: 'africa',
    baseAttributes: { attack: 94, defense: 80, mobility: 92, leadership: 91 },
    skillCards: [
      {
        id: 'hannibal-elephants',
        name: '战象军团',
        trigger: 'on_attack',
        modifier: '+26% attack',
        cooldownMs: 180000,
        durationMs: 60000,
      },
    ],
    colorMapping: {
      primary: 0x8b4513, // Carthage Brown
      secondary: 0x5d2e0d,
      alpha: 0.7,
      pattern: 'elephants',
      label: '汉',
      glowColor: 0xa0522d,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'elizabeth',
    name: '伊丽莎白一世',
    originRegion: 'europe',
    baseAttributes: { attack: 76, defense: 82, mobility: 80, leadership: 92 },
    skillCards: [
      {
        id: 'elizabeth-fleet',
        name: '无敌舰队',
        trigger: 'on_naval',
        modifier: '+24% mobility',
        cooldownMs: 210000,
        durationMs: 75000,
      },
    ],
    colorMapping: {
      primary: 0xff1493, // Royal Pink
      secondary: 0xc71585,
      alpha: 0.7,
      pattern: 'roses',
      label: '伊',
      glowColor: 0xff69b4,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'sun-tzu',
    name: '孙子',
    originRegion: 'asia',
    baseAttributes: { attack: 88, defense: 90, mobility: 85, leadership: 98 },
    skillCards: [
      {
        id: 'sun-tzu-strategy',
        name: '兵法',
        trigger: 'on_battle',
        modifier: '+35% leadership',
        cooldownMs: 240000,
        durationMs: 90000,
      },
    ],
    colorMapping: {
      primary: 0x4169e1, // Strategy Blue
      secondary: 0x1e3a8a,
      alpha: 0.7,
      pattern: 'yin-yang',
      label: '孙',
      glowColor: 0x6495ed,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'shaka',
    name: '沙卡·祖鲁',
    originRegion: 'africa',
    baseAttributes: { attack: 91, defense: 86, mobility: 89, leadership: 88 },
    skillCards: [
      {
        id: 'shaka-impis',
        name: '祖鲁武士',
        trigger: 'on_attack',
        modifier: '+27% attack',
        cooldownMs: 175000,
        durationMs: 58000,
      },
    ],
    colorMapping: {
      primary: 0x8b0000, // Zulu Red
      secondary: 0x5d0000,
      alpha: 0.7,
      pattern: 'shields',
      label: '沙',
      glowColor: 0xb22222,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'charlemagne',
    name: '查理曼大帝',
    originRegion: 'europe',
    baseAttributes: { attack: 87, defense: 84, mobility: 79, leadership: 93 },
    skillCards: [
      {
        id: 'charlemagne-empire',
        name: '帝国荣耀',
        trigger: 'on_expand',
        modifier: '+22% all_stats',
        cooldownMs: 220000,
        durationMs: 80000,
      },
    ],
    colorMapping: {
      primary: 0x4b0082, // Imperial Indigo
      secondary: 0x2f0052,
      alpha: 0.7,
      pattern: 'crowns',
      label: '查',
      glowColor: 0x6a0dad,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'tokugawa',
    name: '德川家康',
    originRegion: 'asia',
    baseAttributes: { attack: 83, defense: 92, mobility: 76, leadership: 94 },
    skillCards: [
      {
        id: 'tokugawa-shogun',
        name: '幕府统治',
        trigger: 'on_defend',
        modifier: '+32% defense',
        cooldownMs: 250000,
        durationMs: 95000,
      },
    ],
    colorMapping: {
      primary: 0x006400, // Shogun Green
      secondary: 0x003d00,
      alpha: 0.7,
      pattern: 'bamboo',
      label: '德',
      glowColor: 0x008000,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'montezuma',
    name: '蒙特祖马',
    originRegion: 'americas',
    baseAttributes: { attack: 85, defense: 81, mobility: 83, leadership: 87 },
    skillCards: [
      {
        id: 'montezuma-eagle',
        name: '鹰武士',
        trigger: 'on_attack',
        modifier: '+23% attack',
        cooldownMs: 195000,
        durationMs: 68000,
      },
    ],
    colorMapping: {
      primary: 0xffd700, // Aztec Gold
      secondary: 0xb8860b,
      alpha: 0.7,
      pattern: 'pyramids',
      label: '蒙',
      glowColor: 0xffed4e,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'catherine',
    name: '叶卡捷琳娜大帝',
    originRegion: 'europe',
    baseAttributes: { attack: 79, defense: 87, mobility: 81, leadership: 95 },
    skillCards: [
      {
        id: 'catherine-enlightenment',
        name: '开明专制',
        trigger: 'on_expand',
        modifier: '+28% leadership',
        cooldownMs: 230000,
        durationMs: 85000,
      },
    ],
    colorMapping: {
      primary: 0xffa500, // Russian Gold
      secondary: 0xd98704,
      alpha: 0.7,
      pattern: 'double-eagle',
      label: '叶',
      glowColor: 0xffb733,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'tamerlane',
    name: '帖木儿',
    originRegion: 'asia',
    baseAttributes: { attack: 96, defense: 74, mobility: 94, leadership: 89 },
    skillCards: [
      {
        id: 'tamerlane-conquest',
        name: '铁骑征服',
        trigger: 'on_attack',
        modifier: '+30% attack',
        cooldownMs: 165000,
        durationMs: 52000,
      },
    ],
    colorMapping: {
      primary: 0x800080, // Timurid Purple
      secondary: 0x4b0082,
      alpha: 0.7,
      pattern: 'crescents',
      label: '帖',
      glowColor: 0x9932cc,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'frederick',
    name: '腓特烈大帝',
    originRegion: 'europe',
    baseAttributes: { attack: 89, defense: 86, mobility: 82, leadership: 92 },
    skillCards: [
      {
        id: 'frederick-discipline',
        name: '普鲁士纪律',
        trigger: 'on_battle',
        modifier: '+25% defense',
        cooldownMs: 205000,
        durationMs: 72000,
      },
    ],
    colorMapping: {
      primary: 0x191970, // Prussian Blue
      secondary: 0x0e0e3d,
      alpha: 0.7,
      pattern: 'iron-cross',
      label: '腓',
      glowColor: 0x4169e1,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'sitting-bull',
    name: '坐牛',
    originRegion: 'americas',
    baseAttributes: { attack: 84, defense: 88, mobility: 87, leadership: 86 },
    skillCards: [
      {
        id: 'sitting-bull-spirit',
        name: '大平原精神',
        trigger: 'on_defend',
        modifier: '+26% defense',
        cooldownMs: 215000,
        durationMs: 78000,
      },
    ],
    colorMapping: {
      primary: 0x8b4726, // Native Brown
      secondary: 0x5d2f19,
      alpha: 0.7,
      pattern: 'feathers',
      label: '坐',
      glowColor: 0xa0522d,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'suleiman',
    name: '苏莱曼大帝',
    originRegion: 'europe',
    baseAttributes: { attack: 88, defense: 89, mobility: 83, leadership: 94 },
    skillCards: [
      {
        id: 'suleiman-janissaries',
        name: '禁卫军',
        trigger: 'on_attack',
        modifier: '+24% attack_defense',
        cooldownMs: 200000,
        durationMs: 70000,
      },
    ],
    colorMapping: {
      primary: 0xdc143c, // Ottoman Crimson
      secondary: 0x8b0000,
      alpha: 0.7,
      pattern: 'crescents-stars',
      label: '苏',
      glowColor: 0xff1744,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'yi-sun-sin',
    name: '李舜臣',
    originRegion: 'asia',
    baseAttributes: { attack: 87, defense: 91, mobility: 88, leadership: 90 },
    skillCards: [
      {
        id: 'yi-turtle-ships',
        name: '龟船',
        trigger: 'on_naval',
        modifier: '+29% defense',
        cooldownMs: 185000,
        durationMs: 64000,
      },
    ],
    colorMapping: {
      primary: 0x00ced1, // Korean Turquoise
      secondary: 0x008b8b,
      alpha: 0.7,
      pattern: 'turtles',
      label: '李',
      glowColor: 0x00ffff,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'mansa-musa',
    name: '曼萨·穆萨',
    originRegion: 'africa',
    baseAttributes: { attack: 72, defense: 79, mobility: 78, leadership: 91 },
    skillCards: [
      {
        id: 'mansa-musa-wealth',
        name: '黄金王国',
        trigger: 'on_trade',
        modifier: '+40% resources',
        cooldownMs: 270000,
        durationMs: 110000,
      },
    ],
    colorMapping: {
      primary: 0xdaa520, // Golden Mali
      secondary: 0x8b6914,
      alpha: 0.7,
      pattern: 'gold-dust',
      label: '曼',
      glowColor: 0xffd700,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'pachacuti',
    name: '帕查库特克',
    originRegion: 'americas',
    baseAttributes: { attack: 86, defense: 90, mobility: 79, leadership: 89 },
    skillCards: [
      {
        id: 'pachacuti-inca',
        name: '印加帝国',
        trigger: 'on_expand',
        modifier: '+25% all_stats',
        cooldownMs: 235000,
        durationMs: 88000,
      },
    ],
    colorMapping: {
      primary: 0xff4500, // Inca Orange
      secondary: 0xd43d00,
      alpha: 0.7,
      pattern: 'mountains',
      label: '帕',
      glowColor: 0xff6347,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'bismarck',
    name: '俾斯麦',
    originRegion: 'europe',
    baseAttributes: { attack: 84, defense: 88, mobility: 79, leadership: 93 },
    skillCards: [
      {
        id: 'bismarck-iron',
        name: '铁血政策',
        trigger: 'on_diplomacy',
        modifier: '+26% leadership',
        cooldownMs: 220000,
        durationMs: 82000,
      },
    ],
    colorMapping: {
      primary: 0x2f4f4f, // Iron Gray
      secondary: 0x1c2e2e,
      alpha: 0.7,
      pattern: 'iron-cross',
      label: '俾',
      glowColor: 0x708090,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'peter-great',
    name: '彼得大帝',
    originRegion: 'europe',
    baseAttributes: { attack: 85, defense: 82, mobility: 84, leadership: 91 },
    skillCards: [
      {
        id: 'peter-westernization',
        name: '西化改革',
        trigger: 'on_expand',
        modifier: '+24% all_stats',
        cooldownMs: 240000,
        durationMs: 90000,
      },
    ],
    colorMapping: {
      primary: 0x4682b4, // Steel Blue
      secondary: 0x315a7a,
      alpha: 0.7,
      pattern: 'anchors',
      label: '彼',
      glowColor: 0x5f9ea0,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'zhuge-liang',
    name: '诸葛亮',
    originRegion: 'asia',
    baseAttributes: { attack: 75, defense: 88, mobility: 80, leadership: 97 },
    skillCards: [
      {
        id: 'zhuge-strategy',
        name: '锦囊妙计',
        trigger: 'on_defend',
        modifier: '+33% defense',
        cooldownMs: 235000,
        durationMs: 87000,
      },
    ],
    colorMapping: {
      primary: 0x20b2aa, // Strategist Teal
      secondary: 0x147a75,
      alpha: 0.7,
      pattern: 'fans',
      label: '诸',
      glowColor: 0x40e0d0,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'william-conqueror',
    name: '征服者威廉',
    originRegion: 'europe',
    baseAttributes: { attack: 90, defense: 84, mobility: 82, leadership: 88 },
    skillCards: [
      {
        id: 'william-conquest',
        name: '诺曼征服',
        trigger: 'on_attack',
        modifier: '+25% attack',
        cooldownMs: 195000,
        durationMs: 69000,
      },
    ],
    colorMapping: {
      primary: 0x8b0000, // Norman Red
      secondary: 0x5d0000,
      alpha: 0.7,
      pattern: 'lions',
      label: '威',
      glowColor: 0xb22222,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'ramesses',
    name: '拉美西斯二世',
    originRegion: 'africa',
    baseAttributes: { attack: 86, defense: 89, mobility: 78, leadership: 92 },
    skillCards: [
      {
        id: 'ramesses-monuments',
        name: '法老神威',
        trigger: 'on_defend',
        modifier: '+28% defense',
        cooldownMs: 225000,
        durationMs: 83000,
      },
    ],
    colorMapping: {
      primary: 0xdaa520, // Pharaoh Gold
      secondary: 0xa67c00,
      alpha: 0.7,
      pattern: 'pyramids',
      label: '拉',
      glowColor: 0xffd700,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'kublai-khan',
    name: '忽必烈',
    originRegion: 'asia',
    baseAttributes: { attack: 89, defense: 81, mobility: 91, leadership: 90 },
    skillCards: [
      {
        id: 'kublai-yuan',
        name: '元朝铁骑',
        trigger: 'on_attack',
        modifier: '+27% mobility',
        cooldownMs: 170000,
        durationMs: 57000,
      },
    ],
    colorMapping: {
      primary: 0xff8c00, // Yuan Orange
      secondary: 0xd97500,
      alpha: 0.7,
      pattern: 'dragons',
      label: '忽',
      glowColor: 0xffa500,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'cyrus',
    name: '居鲁士大帝',
    originRegion: 'asia',
    baseAttributes: { attack: 88, defense: 85, mobility: 83, leadership: 94 },
    skillCards: [
      {
        id: 'cyrus-tolerance',
        name: '波斯帝国',
        trigger: 'on_expand',
        modifier: '+23% leadership',
        cooldownMs: 215000,
        durationMs: 78000,
      },
    ],
    colorMapping: {
      primary: 0x9932cc, // Persian Purple
      secondary: 0x6a1f99,
      alpha: 0.7,
      pattern: 'lions-sun',
      label: '居',
      glowColor: 0xba55d3,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'richard-lionheart',
    name: '狮心王理查',
    originRegion: 'europe',
    baseAttributes: { attack: 93, defense: 80, mobility: 87, leadership: 86 },
    skillCards: [
      {
        id: 'richard-crusade',
        name: '十字军',
        trigger: 'on_attack',
        modifier: '+29% attack',
        cooldownMs: 180000,
        durationMs: 62000,
      },
    ],
    colorMapping: {
      primary: 0xdc143c, // Crusader Red
      secondary: 0xa00d2b,
      alpha: 0.7,
      pattern: 'crosses',
      label: '理',
      glowColor: 0xff1744,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'tokugawa-ieyasu',
    name: '织田信长',
    originRegion: 'asia',
    baseAttributes: { attack: 92, defense: 78, mobility: 86, leadership: 89 },
    skillCards: [
      {
        id: 'oda-unification',
        name: '天下布武',
        trigger: 'on_attack',
        modifier: '+28% attack',
        cooldownMs: 175000,
        durationMs: 60000,
      },
    ],
    colorMapping: {
      primary: 0xff4500, // Oda Red
      secondary: 0xd43d00,
      alpha: 0.7,
      pattern: 'samurai',
      label: '织',
      glowColor: 0xff6347,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'lincoln',
    name: '林肯',
    originRegion: 'americas',
    baseAttributes: { attack: 76, defense: 86, mobility: 78, leadership: 92 },
    skillCards: [
      {
        id: 'lincoln-union',
        name: '联邦之父',
        trigger: 'on_alliance',
        modifier: '+27% leadership',
        cooldownMs: 230000,
        durationMs: 85000,
      },
    ],
    colorMapping: {
      primary: 0x191970, // Union Blue
      secondary: 0x0e0e3d,
      alpha: 0.7,
      pattern: 'stars-stripes',
      label: '林',
      glowColor: 0x4169e1,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'shivaji',
    name: '希瓦吉',
    originRegion: 'asia',
    baseAttributes: { attack: 87, defense: 89, mobility: 84, leadership: 88 },
    skillCards: [
      {
        id: 'shivaji-maratha',
        name: '马拉塔战士',
        trigger: 'on_defend',
        modifier: '+26% defense',
        cooldownMs: 210000,
        durationMs: 76000,
      },
    ],
    colorMapping: {
      primary: 0xff8c00, // Maratha Orange
      secondary: 0xd97500,
      alpha: 0.7,
      pattern: 'tigers',
      label: '希',
      glowColor: 0xffa500,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'gustavus',
    name: '古斯塔夫二世',
    originRegion: 'europe',
    baseAttributes: { attack: 91, defense: 83, mobility: 88, leadership: 90 },
    skillCards: [
      {
        id: 'gustavus-lion',
        name: '北方雄狮',
        trigger: 'on_attack',
        modifier: '+26% attack',
        cooldownMs: 185000,
        durationMs: 64000,
      },
    ],
    colorMapping: {
      primary: 0x4169e1, // Swedish Blue
      secondary: 0x1e3a8a,
      alpha: 0.7,
      pattern: 'nordic',
      label: '古',
      glowColor: 0x6495ed,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'sejong',
    name: '世宗大王',
    originRegion: 'asia',
    baseAttributes: { attack: 74, defense: 84, mobility: 77, leadership: 96 },
    skillCards: [
      {
        id: 'sejong-enlightenment',
        name: '文化繁荣',
        trigger: 'on_develop',
        modifier: '+35% leadership',
        cooldownMs: 260000,
        durationMs: 100000,
      },
    ],
    colorMapping: {
      primary: 0xff1493, // Joseon Pink
      secondary: 0xc71585,
      alpha: 0.7,
      pattern: 'hangul',
      label: '世',
      glowColor: 0xff69b4,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'trajan',
    name: '图拉真',
    originRegion: 'europe',
    baseAttributes: { attack: 87, defense: 88, mobility: 81, leadership: 91 },
    skillCards: [
      {
        id: 'trajan-expansion',
        name: '罗马扩张',
        trigger: 'on_expand',
        modifier: '+24% all_stats',
        cooldownMs: 220000,
        durationMs: 81000,
      },
    ],
    colorMapping: {
      primary: 0x800020, // Roman Burgundy
      secondary: 0x4d0013,
      alpha: 0.7,
      pattern: 'eagles',
      label: '图',
      glowColor: 0xa0153e,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'ashoka',
    name: '阿育王',
    originRegion: 'asia',
    baseAttributes: { attack: 82, defense: 87, mobility: 79, leadership: 93 },
    skillCards: [
      {
        id: 'ashoka-dharma',
        name: '正法治国',
        trigger: 'on_alliance',
        modifier: '+28% leadership',
        cooldownMs: 240000,
        durationMs: 90000,
      },
    ],
    colorMapping: {
      primary: 0xff9933, // Ashoka Orange
      secondary: 0xcc7a29,
      alpha: 0.7,
      pattern: 'chakra',
      label: '阿',
      glowColor: 0xffad5c,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'hiawatha',
    name: '海华沙',
    originRegion: 'americas',
    baseAttributes: { attack: 79, defense: 85, mobility: 86, leadership: 84 },
    skillCards: [
      {
        id: 'hiawatha-confederation',
        name: '易洛魁联盟',
        trigger: 'on_alliance',
        modifier: '+25% all_stats',
        cooldownMs: 230000,
        durationMs: 84000,
      },
    ],
    colorMapping: {
      primary: 0x8b4513, // Iroquois Brown
      secondary: 0x5d2e0d,
      alpha: 0.7,
      pattern: 'longhouse',
      label: '海',
      glowColor: 0xa0522d,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'leonidas',
    name: '列奥尼达',
    originRegion: 'europe',
    baseAttributes: { attack: 89, defense: 95, mobility: 77, leadership: 87 },
    skillCards: [
      {
        id: 'leonidas-spartans',
        name: '斯巴达勇士',
        trigger: 'on_defend',
        modifier: '+34% defense',
        cooldownMs: 190000,
        durationMs: 66000,
      },
    ],
    colorMapping: {
      primary: 0x8b0000, // Spartan Red
      secondary: 0x5d0000,
      alpha: 0.7,
      pattern: 'shields-lambda',
      label: '列',
      glowColor: 0xb22222,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'harun',
    name: '哈伦·拉希德',
    originRegion: 'asia',
    baseAttributes: { attack: 81, defense: 83, mobility: 82, leadership: 90 },
    skillCards: [
      {
        id: 'harun-golden-age',
        name: '黄金时代',
        trigger: 'on_develop',
        modifier: '+30% leadership',
        cooldownMs: 245000,
        durationMs: 92000,
      },
    ],
    colorMapping: {
      primary: 0xffd700, // Abbasid Gold
      secondary: 0xb8860b,
      alpha: 0.7,
      pattern: 'minarets',
      label: '哈',
      glowColor: 0xffed4e,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'boudica',
    name: '布狄卡',
    originRegion: 'europe',
    baseAttributes: { attack: 88, defense: 82, mobility: 89, leadership: 85 },
    skillCards: [
      {
        id: 'boudica-rebellion',
        name: '不列颠起义',
        trigger: 'on_attack',
        modifier: '+27% attack',
        cooldownMs: 180000,
        durationMs: 61000,
      },
    ],
    colorMapping: {
      primary: 0x228b22, // Celtic Green
      secondary: 0x145a14,
      alpha: 0.7,
      pattern: 'celtic-knots',
      label: '布',
      glowColor: 0x32cd32,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'meiji',
    name: '明治天皇',
    originRegion: 'asia',
    baseAttributes: { attack: 78, defense: 81, mobility: 83, leadership: 94 },
    skillCards: [
      {
        id: 'meiji-restoration',
        name: '明治维新',
        trigger: 'on_develop',
        modifier: '+32% all_stats',
        cooldownMs: 250000,
        durationMs: 95000,
      },
    ],
    colorMapping: {
      primary: 0xff0000, // Rising Sun Red
      secondary: 0xcc0000,
      alpha: 0.7,
      pattern: 'chrysanthemum',
      label: '明',
      glowColor: 0xff3333,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'zhu-yuanzhang',
    name: '朱元璋',
    originRegion: 'asia',
    baseAttributes: { attack: 86, defense: 87, mobility: 80, leadership: 92 },
    skillCards: [
      {
        id: 'zhu-ming',
        name: '明朝开国',
        trigger: 'on_expand',
        modifier: '+26% all_stats',
        cooldownMs: 225000,
        durationMs: 83000,
      },
    ],
    colorMapping: {
      primary: 0xff6600, // Ming Orange
      secondary: 0xcc5200,
      alpha: 0.7,
      pattern: 'dragons-phoenix',
      label: '朱',
      glowColor: 0xff8533,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'simon-bolivar',
    name: '圣马丁',
    originRegion: 'americas',
    baseAttributes: { attack: 83, defense: 79, mobility: 85, leadership: 88 },
    skillCards: [
      {
        id: 'san-martin-andes',
        name: '安第斯军团',
        trigger: 'on_attack',
        modifier: '+24% mobility',
        cooldownMs: 205000,
        durationMs: 73000,
      },
    ],
    colorMapping: {
      primary: 0x0033a0, // Argentine Blue
      secondary: 0x002266,
      alpha: 0.7,
      pattern: 'andes',
      label: '圣',
      glowColor: 0x0055cc,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'nzinga',
    name: '恩津加女王',
    originRegion: 'africa',
    baseAttributes: { attack: 84, defense: 86, mobility: 83, leadership: 87 },
    skillCards: [
      {
        id: 'nzinga-resistance',
        name: '抗争精神',
        trigger: 'on_defend',
        modifier: '+27% defense',
        cooldownMs: 215000,
        durationMs: 78000,
      },
    ],
    colorMapping: {
      primary: 0x8b4513, // African Brown
      secondary: 0x5d2e0d,
      alpha: 0.7,
      pattern: 'warriors',
      label: '恩',
      glowColor: 0xa0522d,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'barbarossa',
    name: '巴巴罗萨',
    originRegion: 'europe',
    baseAttributes: { attack: 90, defense: 79, mobility: 92, leadership: 86 },
    skillCards: [
      {
        id: 'barbarossa-corsairs',
        name: '海盗舰队',
        trigger: 'on_naval',
        modifier: '+30% mobility',
        cooldownMs: 175000,
        durationMs: 59000,
      },
    ],
    colorMapping: {
      primary: 0xdc143c, // Corsair Red
      secondary: 0xa00d2b,
      alpha: 0.7,
      pattern: 'ships',
      label: '巴',
      glowColor: 0xff1744,
      pulseSpeed: 1000,
    },
  },
  {
    id: 'victoria',
    name: '维多利亚女王',
    originRegion: 'europe',
    baseAttributes: { attack: 75, defense: 88, mobility: 81, leadership: 95 },
    skillCards: [
      {
        id: 'victoria-empire',
        name: '日不落帝国',
        trigger: 'on_expand',
        modifier: '+29% leadership',
        cooldownMs: 240000,
        durationMs: 89000,
      },
    ],
    colorMapping: {
      primary: 0xff1493, // Victorian Pink
      secondary: 0xc71585,
      alpha: 0.7,
      pattern: 'roses-crown',
      label: '维',
      glowColor: 0xff69b4,
      pulseSpeed: 1000,
    },
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
