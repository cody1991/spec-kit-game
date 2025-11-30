# Implementation Plan: 战报排序与领土更新修复

**Branch**: `004-fix-battle-territory-bugs` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/004-fix-battle-territory-bugs/spec.md`

## Summary

修复游戏中的两个核心问题：(1) 战报系统显示乱序且存在重复记录，导致玩家无法追踪战局动态；(2) 地图领土初始化后不再响应归属变化，破坏了视觉反馈。技术方案采用三重ID保障（时间戳+性能计数器+序列号）确保战报唯一性，通过Zustand订阅机制建立领土状态的双向同步（territories数组 ↔ territoryStates Map），并在WorldScene中实现订阅式渲染替代轮询。修复后战报保持时间戳降序排列且100%去重，地图颜色在1秒内响应领土易手，无需引入新依赖或重构核心架构。

## Technical Context

**Language/Version**: TypeScript 5.4（严格模式，ESM）  
**Primary Dependencies**: Phaser 3.80（地图渲染）、React 18（UI面板）、Zustand 4（状态管理与订阅）  
**Storage**: IndexedDB（eventLog持久化）、Zustand内存存储（territories、territoryStates）  
**Testing**: Vitest（单元测试：ID生成、排序算法、同步逻辑）、Testing Library（BattleTimeline组件）、Playwright（E2E验证战报顺序和地图更新）  
**Target Platform**: 桌面浏览器（Chrome/Edge/Firefox/Safari最新两版本）+ iPadOS 16+横屏  
**Project Type**: 单体Web SPA（现有架构，无需新增项目）  
**Performance Goals**: 战报排序<5ms（200条记录）；领土更新触发<1ms；地图渲染保持60 FPS；订阅回调延迟<16ms  
**Constraints**: 不引入新的第三方依赖；保持向后兼容（现有存档可用）；不破坏现有测试；修复后代码复杂度不增加（控制在现有阈值内）  
**Scale/Scope**: 修改4个核心文件（battleSystem.ts、BattleTimeline.tsx、store.ts、WorldScene.ts）；新增2个单元测试套件；E2E测试增加验证断言；约200行代码变更

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### ✅ Phase 0 初始评估

1. **代码质量门禁**：
   - ✅ 遵循现有ESLint + Prettier配置，无新增规则
   - ✅ 修改的4个文件均在复杂度阈值内（循环复杂度<15）
   - ✅ 新增函数配有JSDoc注释（`generateBattleEventId`、`verifyTerritoryStatesComplete`等）
   - ✅ PR模板要求记录修复的根因和数据流变更
   - **风险**: 双向同步逻辑增加了状态管理复杂度，需在评审中重点关注不变性约束

2. **测试门禁**：
   - ✅ 测试金字塔完整：
     - 单元测试：ID生成、排序算法、timestamp验证（Vitest）
     - 组件测试：BattleTimeline去重渲染（Testing Library）
     - 集成测试：领土更新同步链路（Vitest + Zustand mock）
     - E2E测试：完整游戏会话中战报顺序和地图更新（Playwright）
   - ✅ 覆盖率目标：修改代码的90%（现有基线已达90%）
   - ✅ CI阻塞：任何测试失败均阻塞合并
   - **策略**: 测试先行，为每个bug编写失败测试再修复

3. **体验门禁**：
   - ✅ 目标用户：策略游戏爱好者、休闲观战者
   - ✅ 成功路径：玩家在游戏中可清晰追踪最新战报，地图实时反映势力变化
   - ✅ 失败路径：
     - 如果timestamp无效 → 排序使用添加顺序作为fallback，不中断渲染
     - 如果colorMapping缺失 → 使用灰色默认值并记录警告
     - 如果同步失败 → 控制台记录但不崩溃，下次tick自动恢复
   - ✅ 可用性验证：战报面板保持原有键盘可访问性，地图交互不受影响
   - **指标**: 修复后"战报理解度"应从<60%提升至≥90%（用户测试）

4. **性能门禁**：
   - ✅ 端到端预算：
     - 战报渲染：<5ms（200条记录排序+去重）
     - 领土更新：<1ms（Map操作 + 订阅通知）
     - 地图渲染：保持60 FPS（订阅式更新比轮询更高效）
   - ✅ 基准方案：在修复前后运行相同的100次战斗场景，对比帧率和内存
   - ✅ 降级策略：如果排序耗时>10ms，自动切换到只显示最近10条（当前20条）
   - ✅ 监测：Dev HUD显示战报渲染耗时和领土更新频率
   - **风险**: 订阅回调如果执行过慢可能阻塞主线程，需确保回调<16ms

5. **可观测性门禁**：
   - ✅ 日志最小集合：
     - `[BattleEvent] Generated: ${id} at ${timestamp}`（INFO）
     - `[BattleTimeline] Detected duplicate ID: ${id}`（WARN）
     - `[Territory] Ownership changed: ${id} ${old} → ${new}`（INFO）
     - `[WorldScene] Missing color mapping: ${commanderId}`（WARN）
   - ✅ 指标：
     - `battle_events_total`（计数器）
     - `battle_timeline_render_ms`（直方图）
     - `territory_updates_total`（计数器）
     - `territory_sync_mismatches`（计数器，应为0）
   - ✅ 追踪：在Dev模式下记录每次领土更新的完整调用栈
   - ✅ 仪表盘：复用现有 `app/telemetry/dashboard.md`，新增"战报/领土"部分
   - **上线后验证**: 24小时内检查控制台日志，确认无重复ID警告和同步错误

### 🔄 Phase 1 设计后复查

（待 data-model.md 和 contracts/ 生成后填写）

**预期变化**：
- 数据模型文档确认实体关系无环依赖
- 合同测试覆盖ID生成的并发场景
- 性能基准测试脚本就位

## Project Structure

### Documentation (this feature)

```text
specs/004-fix-battle-territory-bugs/
├── plan.md              # ✅ This file
├── research.md          # ✅ Phase 0 output (root cause analysis & solutions)
├── data-model.md        # ✅ Phase 1 output (entity enhancements)
├── quickstart.md        # ✅ Phase 1 output (verification & fix steps)
├── contracts/           # ⏳ Phase 1 output (test contracts)
│   ├── battleEvent.contract.ts
│   └── territorySync.contract.ts
└── tasks.md             # ⏳ Phase 2 output (/speckit.tasks - NOT created yet)
```

### Source Code (repository root)

```text
app/
├── src/
│   ├── core/
│   │   ├── simulation/
│   │   │   └── systems/
│   │   │       └── battleSystem.ts          # 🔧 修改：ID生成、计数器重置
│   │   ├── state/
│   │   │   └── store.ts                     # 🔧 修改：双向同步、重置逻辑
│   │   └── types.ts                         # 📝 可能小幅调整类型定义
│   ├── scenes/
│   │   └── world/
│   │       └── WorldScene.ts                # 🔧 修改：订阅机制、初始化验证
│   └── ui/
│       └── panels/
│           └── BattleTimeline.tsx           # 🔧 修改：排序算法、去重逻辑

tests/
├── unit/
│   ├── core/
│   │   └── battleSystem.spec.ts            # ✅ 新增：ID唯一性测试
│   └── ui/
│       └── BattleTimeline.spec.tsx         # ✅ 新增：排序和去重测试
├── contract/
│   └── territorySync.contract.spec.ts      # ✅ 新增：同步链路合同测试
└── e2e/
    ├── us1-start-game.spec.ts              # 🔧 增强：验证战报顺序
    └── us2-territory-visualization.spec.ts # 🔧 增强：验证地图更新
```

**Structure Decision**: 

本次修复为bug fix而非新功能，因此复用现有单体SPA结构，无需新增模块或目录。关键修改集中在4个核心文件：

1. **battleSystem.ts**: 战报ID生成器和计数器管理
2. **BattleTimeline.tsx**: UI层排序和去重逻辑
3. **store.ts**: 状态管理层的双向同步
4. **WorldScene.ts**: Phaser场景层的订阅和渲染

测试结构遵循现有金字塔：单元测试覆盖算法逻辑，合同测试覆盖数据流链路，E2E测试覆盖用户可见行为。

## Complexity Tracking

> 本次修复未引入超出宪章允许的复杂度，无需额外豁免。

**复杂度分析**：

| 维度                 | 现状                                    | 修复后                                      | 评估                       |
| -------------------- | --------------------------------------- | ------------------------------------------- | -------------------------- |
| **文件数**           | 4个文件修改                             | 4个文件修改                                 | ✅ 无新增文件               |
| **循环复杂度**       | battleSystem: 12, store: 8              | battleSystem: 13, store: 10                 | ✅ 均<15阈值                |
| **状态管理层级**     | 单一Zustand store                       | 单一store + 订阅机制                        | ✅ 无新增状态容器           |
| **数据同步路径**     | 单向（territories更新）                 | 双向（territories ↔ territoryStates）       | ⚠️ 需重点评审不变性         |
| **依赖项**           | 0个新增                                 | 0个新增                                     | ✅ 无外部依赖               |
| **测试复杂度**       | 单元+集成+E2E三层                       | 单元+集成+E2E三层                           | ✅ 维持现有结构             |

**风险缓解**：

1. **双向同步复杂度**：
   - 问题：territories数组和territoryStates Map需保持一致性，增加状态管理复杂度
   - 缓解：
     - 封装 `updateTerritory` 方法确保原子性操作
     - 在初始化时添加验证循环检测不一致
     - 编写合同测试覆盖所有同步路径
     - 文档化数据流（见 data-model.md）

2. **订阅机制内存泄漏**：
   - 问题：Zustand订阅如果未正确清理可能导致内存泄漏
   - 缓解：
     - 在 `WorldScene.shutdown()` 中显式调用 `unsubscribe()`
     - 添加E2E测试验证多次开局/重置后无内存增长
     - 使用Chrome DevTools Memory Profiler验证

3. **全局计数器状态**：
   - 问题：模块级变量 `battleEventCounter` 在多次游戏会话间可能产生意外状态
   - 缓解：
     - 在 `resetGame()` 中强制重置计数器
     - 单元测试覆盖计数器重置场景
     - 文档化计数器生命周期

**合规声明**：

- ✅ 无新增项目或仓库
- ✅ 无引入设计模式（如Repository、Factory等）
- ✅ 保持现有分层架构（Phaser Scene / React UI / Zustand Store）
- ✅ 修改的代码复杂度在可接受范围内

若后续发现复杂度超出预期，将在Phase 2 (tasks.md) 中重新评估并申请豁免。
