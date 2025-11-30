# Quick Start Guide: 国家与地图精准对齐

**Feature**: 003-country-map-alignment  
**Date**: 2025-11-30  
**Target Audience**: 开发者

## 概述

本指南帮助开发者快速理解和实施"国家与地图精准对齐"功能。核心目标是修复当前版本中国家名称与地图位置不匹配的问题，通过建立准确的 region-to-country 映射表实现。

**预计阅读时间**: 10 分钟  
**预计实施时间**: 4-6 小时

---

## 背景

### 问题描述

当前版本中，指挥官显示占领的国家名称（如"中国"）与地图上的实际位置不匹配。例如：
- 秦始皇显示"占领中国"，但地图上标记的位置可能是欧洲
- 拿破仑显示"占领法国"，但地图上标记的位置可能是亚洲

### 根本原因

`WorldScene.ts` 中的 `regionCountryMap` 映射表存在错误，导致旧的区域 ID（如 'china', 'russia'）无法正确映射到真实的国家 ID（ISO 3166-1 numeric codes）。

### 解决方案

创建准确的 region-to-country 映射配置文件，并修复映射逻辑。

---

## 快速上手

### Step 1: 理解数据流

```
旧系统（当前）:
commander.controlledTerritories = ['china', 'russia'] (region IDs)
         ↓ (错误的映射)
territoryStates.set('wrong-country-id', ...)
         ↓
地图渲染错误位置

新系统（目标）:
commander.controlledTerritories = ['china', 'russia'] (region IDs)
         ↓ (正确的映射：使用 regionMapping.config.ts)
territoryStates.set('156', ...) // 156 = China (ISO 3166-1)
territoryStates.set('643', ...) // 643 = Russia (ISO 3166-1)
         ↓
地图渲染正确位置
```

### Step 2: 创建映射配置文件

**文件位置**: `app/src/config/regionMapping.config.ts`

```typescript
// app/src/config/regionMapping.config.ts

/**
 * Region-to-Country Mapping Configuration
 * 
 * Maps legacy region IDs to ISO 3166-1 numeric country codes.
 * Reference: https://www.iso.org/iso-3166-country-codes.html
 */

export interface RegionMapping {
  id: string;           // 旧 region ID（如 'china', 'western-europe'）
  name: string;         // 区域名称（显示用）
  nameEn?: string;      // 英文名称（可选）
  countryIds: string[]; // ISO 3166-1 numeric codes
  description?: string; // 地理范围说明（可选）
}

/**
 * 完整的 region-to-country 映射表
 */
export const REGION_COUNTRY_MAPPINGS: RegionMapping[] = [
  {
    id: 'china',
    name: '中国',
    nameEn: 'China',
    countryIds: ['156'], // China
    description: '东亚地区，中华人民共和国'
  },
  {
    id: 'russia',
    name: '俄罗斯',
    nameEn: 'Russia',
    countryIds: ['643'], // Russia
    description: '欧亚地区，俄罗斯联邦'
  },
  {
    id: 'western-europe',
    name: '西欧',
    nameEn: 'Western Europe',
    countryIds: [
      '250', // France
      '276', // Germany
      '380', // Italy
      '528', // Netherlands
      '56',  // Belgium
      '442', // Luxembourg
      '724'  // Spain
    ],
    description: '西欧地区，包括法国、德国、意大利等主要国家'
  },
  {
    id: 'eastern-europe',
    name: '东欧',
    nameEn: 'Eastern Europe',
    countryIds: [
      '616', // Poland
      '804', // Ukraine
      '348', // Hungary
      '203', // Czech Republic
      '642'  // Romania
    ],
    description: '东欧地区，包括波兰、乌克兰等国家'
  },
  {
    id: 'middle-east',
    name: '中东',
    nameEn: 'Middle East',
    countryIds: [
      '682', // Saudi Arabia
      '784', // United Arab Emirates
      '792', // Turkey
      '368', // Iraq
      '364'  // Iran
    ]
  },
  {
    id: 'india',
    name: '印度',
    nameEn: 'India',
    countryIds: ['356'], // India
    description: '南亚地区，印度共和国'
  },
  {
    id: 'japan',
    name: '日本',
    nameEn: 'Japan',
    countryIds: ['392'], // Japan
    description: '东亚岛国，日本国'
  },
  {
    id: 'southeast-asia',
    name: '东南亚',
    nameEn: 'Southeast Asia',
    countryIds: [
      '704', // Vietnam
      '764', // Thailand
      '360', // Indonesia
      '458', // Malaysia
      '608'  // Philippines
    ]
  },
  {
    id: 'north-africa',
    name: '北非',
    nameEn: 'North Africa',
    countryIds: [
      '818', // Egypt
      '012', // Algeria
      '434', // Libya
      '788', // Tunisia
      '504'  // Morocco
    ]
  },
  {
    id: 'central-africa',
    name: '中非',
    nameEn: 'Central Africa',
    countryIds: [
      '180', // DR Congo
      '178', // Congo
      '408', // Kenya
      '120'  // Cameroon
    ]
  },
  {
    id: 'south-africa',
    name: '南非',
    nameEn: 'South Africa',
    countryIds: ['710'], // South Africa
    description: '南部非洲，南非共和国'
  },
  {
    id: 'north-america',
    name: '北美',
    nameEn: 'North America',
    countryIds: [
      '840', // United States
      '124'  // Canada
    ]
  },
  {
    id: 'central-america',
    name: '中美洲',
    nameEn: 'Central America',
    countryIds: [
      '484', // Mexico
      '188', // Costa Rica
      '591'  // Panama
    ]
  },
  {
    id: 'south-america',
    name: '南美',
    nameEn: 'South America',
    countryIds: [
      '076', // Brazil
      '032', // Argentina
      '170', // Colombia
      '152'  // Chile
    ]
  },
  {
    id: 'australia',
    name: '澳大利亚',
    nameEn: 'Australia',
    countryIds: ['036'], // Australia
    description: '大洋洲，澳大利亚联邦'
  }
];

/**
 * 辅助函数：根据 region ID 查找对应的 country IDs
 */
export function getCountryIdsByRegion(regionId: string): string[] {
  const mapping = REGION_COUNTRY_MAPPINGS.find(m => m.id === regionId);
  return mapping?.countryIds || [];
}

/**
 * 辅助函数：创建 region ID 到 country IDs 的 Map（优化查找性能）
 */
export function createRegionCountryMap(): Map<string, string[]> {
  return new Map(
    REGION_COUNTRY_MAPPINGS.map(m => [m.id, m.countryIds])
  );
}
```

### Step 3: 修复 WorldScene 映射逻辑

**文件位置**: `app/src/scenes/world/WorldScene.ts`

**修改内容**:

```typescript
// 在文件顶部添加 import
import { createRegionCountryMap } from '@/config/regionMapping.config';

// 在 WorldScene 类中修改 mapCountriesToCommanders 方法
private mapCountriesToCommanders(): void {
  const state = useGameStore.getState();
  const { commanders } = state;

  console.log('🔍 Starting country-to-commander mapping...');
  
  // 使用新的映射配置
  const regionCountryMap = createRegionCountryMap();
  
  // 验证映射配置（开发模式）
  if (process.env.NODE_ENV === 'development') {
    console.log('   Region-Country Map entries:', regionCountryMap.size);
  }

  // 创建国家所有权 Map
  const countryOwnership = new Map<string, string>();
  
  commanders.forEach((commander) => {
    commander.controlledTerritories.forEach((regionId) => {
      // 使用映射表查找对应的国家 IDs
      const countryIds = regionCountryMap.get(regionId);
      
      if (countryIds) {
        console.log(`   Mapping ${regionId} -> [${countryIds.join(', ')}]`);
        countryIds.forEach((countryId) => {
          countryOwnership.set(countryId, commander.id);
        });
      } else {
        console.warn(`⚠️  Region "${regionId}" not found in mapping table`);
      }
    });
  });

  console.log(`   Country ownership map size: ${countryOwnership.size}`);

  // 创建 territory states（使用 country IDs 作为 key）
  const territoryStates = new Map();
  this.countries.forEach((country) => {
    const ownerId = countryOwnership.get(country.id);
    
    if (ownerId) {
      territoryStates.set(country.id, {
        countryId: country.id,
        countryName: country.name, // 使用真实国家名称
        ownerId,
        troops: 50,
        resources: 0,
        defense: 70,
        updatedAt: Date.now(),
        conqueredAt: Date.now(),
        previousOwnerId: null,
        transitionProgress: null,
        isHighlighted: false,
      });
    }
  });

  // 更新 store
  state.setTerritoryStates(territoryStates);
  
  console.log(`🗺️  Mapped ${territoryStates.size} countries to ${commanders.length} commanders`);
  
  // 日志映射详情（开发模式）
  if (process.env.NODE_ENV === 'development') {
    const samples = Array.from(territoryStates.entries()).slice(0, 3);
    console.log('   Sample mappings:', samples.map(([countryId, ts]) => {
      const country = this.countries.find(c => c.id === countryId);
      const commander = commanders.find(c => c.id === ts.ownerId);
      return `${country?.name || countryId} -> ${commander?.name || ts.ownerId}`;
    }));
  }
}
```

### Step 4: 添加验证逻辑（可选但推荐）

**文件位置**: `app/src/core/validation/mappingValidator.ts`

```typescript
import type { RegionMapping } from '@/config/regionMapping.config';
import type { Country } from '@core/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class MappingValidator {
  validate(
    mappings: RegionMapping[],
    countries: Country[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 创建国家 ID 集合（快速查找）
    const validCountryIds = new Set(countries.map(c => c.id));
    
    // 检查每个映射
    const usedCountryIds = new Set<string>();
    mappings.forEach((mapping) => {
      // 检查 country IDs 是否有效
      mapping.countryIds.forEach((countryId) => {
        if (!validCountryIds.has(countryId)) {
          errors.push(
            `Invalid country ID "${countryId}" in region "${mapping.id}"`
          );
        }
        
        // 检查是否重复
        if (usedCountryIds.has(countryId)) {
          errors.push(
            `Duplicate country ID "${countryId}" in region "${mapping.id}"`
          );
        }
        usedCountryIds.add(countryId);
      });
      
      // 检查区域大小（警告级别）
      if (mapping.countryIds.length > 7) {
        warnings.push(
          `Region "${mapping.id}" has ${mapping.countryIds.length} countries (recommended: 1-7)`
        );
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

**在 WorldScene 中使用验证器**:

```typescript
// 在 mapCountriesToCommanders 方法开头
const validator = new MappingValidator();
const validationResult = validator.validate(
  REGION_COUNTRY_MAPPINGS,
  this.countries
);

if (!validationResult.valid) {
  console.error('❌ Mapping validation failed:', validationResult.errors);
}

if (validationResult.warnings.length > 0) {
  console.warn('⚠️  Mapping warnings:', validationResult.warnings);
}
```

---

## 测试

### 单元测试

**文件位置**: `tests/unit/config/regionMapping.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { REGION_COUNTRY_MAPPINGS, getCountryIdsByRegion } from '@/config/regionMapping.config';

describe('regionMapping.config', () => {
  it('should have 15 region mappings', () => {
    expect(REGION_COUNTRY_MAPPINGS).toHaveLength(15);
  });

  it('should have valid ISO 3166-1 country codes', () => {
    REGION_COUNTRY_MAPPINGS.forEach((mapping) => {
      mapping.countryIds.forEach((countryId) => {
        expect(countryId).toMatch(/^[0-9]{3}$/);
      });
    });
  });

  it('should map china to country ID 156', () => {
    const countryIds = getCountryIdsByRegion('china');
    expect(countryIds).toEqual(['156']);
  });

  it('should return empty array for invalid region', () => {
    const countryIds = getCountryIdsByRegion('invalid-region');
    expect(countryIds).toEqual([]);
  });
});
```

### E2E 测试

**文件位置**: `tests/e2e/us1-country-alignment.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('秦始皇占领的国家名称与地图位置匹配', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('button:has-text("开始征服")');
  
  // 等待地图加载
  await page.waitForSelector('canvas', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(2000); // 等待地图渲染完成
  
  // 点击中国区域（东亚位置，大致坐标）
  const canvas = page.locator('canvas');
  await canvas.click({ position: { x: 800, y: 300 } });
  
  // 验证弹出的详情面板
  const detailPanel = page.locator('.country-detail-panel');
  await expect(detailPanel).toBeVisible({ timeout: 5000 });
  await expect(detailPanel).toContainText('中国');
  await expect(detailPanel).toContainText('秦始皇');
});
```

---

## 验证

### 开发环境验证

1. **启动开发服务器**:
```bash
npm run dev
```

2. **打开浏览器控制台**，查看日志输出:
```
🔍 Starting country-to-commander mapping...
   Mapping china -> [156]
   Mapping western-europe -> [250, 276, 380, 528, 56, 442, 724]
   ...
🗺️  Mapped 45 countries to 10 commanders
   Sample mappings: [
     "中国 -> 秦始皇",
     "France -> 拿破仑",
     ...
   ]
```

3. **点击地图**，验证国家名称和位置是否匹配

### 运行测试

```bash
# 单元测试
npm run test

# E2E 测试
npm run test:e2e

# 覆盖率报告
npm run test:coverage
```

---

## 常见问题

### Q1: 如何找到某个国家的 ISO 3166-1 numeric code？

**A**: 参考 [ISO 3166-1 官方列表](https://www.iso.org/iso-3166-country-codes.html) 或使用以下工具：
```typescript
// 在浏览器控制台中运行
const countries = await fetch('/maps/world-countries.json')
  .then(r => r.json())
  .then(data => /* 解析 TopoJSON */);

console.table(countries.map(c => ({ id: c.id, name: c.name })));
```

### Q2: 如何调试映射错误？

**A**: 
1. 检查控制台日志，查找 `⚠️` 或 `❌` 标记的错误信息
2. 使用 DevHud 组件查看实时映射统计
3. 在 `regionMapping.config.ts` 中添加 `console.log` 调试
4. 运行单元测试验证映射配置：`npm run test tests/unit/config/regionMapping.test.ts`

### Q3: 如何添加新的 region？

**A**: 
1. 在 `REGION_COUNTRY_MAPPINGS` 数组中添加新的 `RegionMapping` 对象
2. 确保 `countryIds` 都是有效的 ISO 3166-1 numeric codes
3. 运行 `npm run lint` 检查类型错误
4. 运行 `npm run test` 验证配置
5. 更新 `commandersData.ts` 中的指挥官 `controlledTerritories`（如需）

---

## 性能优化

### 使用 Map 缓存

映射表使用 `Map` 而非普通对象，查找性能从 O(n) 提升到 O(1)：

```typescript
// ❌ 慢：每次都要遍历数组
const countryIds = REGION_COUNTRY_MAPPINGS.find(m => m.id === regionId)?.countryIds;

// ✅ 快：使用 Map 直接查找
const regionCountryMap = createRegionCountryMap(); // 初始化时创建一次
const countryIds = regionCountryMap.get(regionId);
```

### 延迟验证

生产环境跳过验证逻辑，节省启动时间：

```typescript
if (process.env.NODE_ENV === 'development') {
  const validator = new MappingValidator();
  validator.validate(REGION_COUNTRY_MAPPINGS, countries);
}
```

---

## 下一步

1. **完成核心功能**: 按照 Step 1-4 实施映射修复
2. **添加测试**: 编写单元测试和 E2E 测试
3. **验证结果**: 在开发环境中验证国家对齐准确性
4. **性能测试**: 确保映射操作不超过 50ms
5. **代码审查**: 提交 PR 并请求 peer review

---

## 参考资料

- [spec.md](./spec.md) - 完整的功能规格说明
- [research.md](./research.md) - 技术决策和研究结果
- [data-model.md](./data-model.md) - 数据模型定义
- [contracts/](./contracts/) - API 契约和 JSON Schema
- [ISO 3166-1](https://www.iso.org/iso-3166-country-codes.html) - 国家代码标准

---

**预计阅读时间**: 10 分钟 ✓  
**预计实施时间**: 4-6 小时

如有问题，请在开发者群组中提问或查看完整文档。
