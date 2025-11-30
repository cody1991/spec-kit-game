# Implementation Tasks: 国家与地图精准对齐

**Feature**: 003-country-map-alignment
**Status**: Planning
**Created**: 2025-11-30

## Task Checklist

### Phase 1: Core Mapping Fix (P1)

- [ ] **T1.1**: 创建独立的 region-to-country 映射配置文件
  - 创建 `app/src/config/regionMapping.config.ts`
  - 定义完整的 `REGION_COUNTRY_MAP`，覆盖所有 15 个旧 region IDs
  - 添加 TypeScript 类型定义和文档注释

- [ ] **T1.2**: 修复 `WorldScene.mapCountriesToCommanders()` 方法
  - 导入并使用新的 `REGION_COUNTRY_MAP` 配置
  - 更新映射逻辑，确保正确从 region ID 转换到 country ID
  - 添加映射验证逻辑，检查无效映射并记录警告

- [ ] **T1.3**: 更新状态管理和数据结构
  - 确保 `territoryStates` Map 使用 country IDs 作为键
  - 更新相关的 getter 和 setter 方法
  - 验证整个数据流使用统一的 country IDs

### Phase 2: UI and Validation (P1)

- [ ] **T2.1**: 更新国家显示名称
  - 修改悬停提示框，显示 `country.name` 而非 region ID
  - 修改 `CountryDetailPanel`，显示真实国家名称
  - 修改指挥官详情面板，将 `controlledTerritories` 转换为国家名称列表

- [ ] **T2.2**: 添加映射验证日志
  - 在控制台输出详细的映射过程日志
  - 输出映射统计信息（成功/失败数量）
  - 记录任何映射警告或错误

### Phase 3: Automated Testing (P2)

- [ ] **T3.1**: 创建单元测试
  - 测试 `REGION_COUNTRY_MAP` 配置的完整性
  - 测试映射函数的正确性（正常、边界、错误情况）
  - 目标覆盖率：100%

- [ ] **T3.2**: 创建 E2E 测试
  - 创建 `tests/e2e/us1-country-alignment.spec.ts`
  - 测试至少 10 个关键国家的名称和位置对齐
  - 测试点击国家并验证详情显示的准确性

- [ ] **T3.3**: 集成视觉回归测试
  - 配置 Playwright 截图对比
  - 创建基准截图（修复后的正确状态）
  - 添加到 CI 流水线

### Phase 4: Debug Tools (P3)

- [ ] **T4.1**: 实现调试模式
  - 添加 URL 参数 `?debug=true` 支持
  - 在调试模式下，在地图上叠加显示 country IDs 和名称
  - 添加映射验证报告输出

- [ ] **T4.2**: 增强日志系统
  - 添加结构化日志输出
  - 创建映射验证函数，输出详细报告
  - 记录性能指标（映射时间、验证时间）

## Definition of Done

每个任务完成的标准：
- [ ] 代码实现完成并通过本地测试
- [ ] 单元测试编写并通过（覆盖率达标）
- [ ] 代码审查通过
- [ ] 集成到主分支，CI 测试通过
- [ ] 文档更新（如需）

## Success Validation

完成所有任务后，验证以下成功标准：
- [ ] SC-001: 100% 国家名称与地图位置匹配
- [ ] SC-002: 用户测试 100% 识别准确
- [ ] SC-003: E2E 测试通过率 100%
- [ ] SC-004: 日志清晰，问题定位时间 < 1 分钟
- [ ] SC-005: 性能无回归（启动时间增量 < 50ms，FPS = 60）
- [ ] SC-006: 上线 24 小时无用户投诉
- [ ] SC-007: 代码可维护性（新开发者理解时间 < 10 分钟）
- [ ] SC-008: 视觉回归测试通过
