# Feature Specification: 战报排序与领土更新修复

**Feature Branch**: `004-fix-battle-territory-bugs`  
**Created**: 2025-11-30  
**Status**: Draft  
**Input**: User description: "当前项目存在两个致命的问题：1. 战报系统，时间顺序老是不对，应该最新的显示在最上面。总是乱序，而且存在多条相同的战报 2. 地图上的领土初始化以后就不会更新了"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 战报按时间正序显示且去重 (Priority: P1)

作为玩家，当我查看战报面板时，我希望看到按时间倒序排列的战报（最新的在最上面），并且不会出现重复的战报记录，这样我可以清楚地追踪最新的战斗动态。

**Why this priority**: 这是战报系统的核心功能。如果战报顺序混乱或重复，玩家将无法理解战局进展，严重影响游戏体验和可玩性。这是导致玩家困惑的致命问题。

**Independent Test**: 可以通过开始一局游戏，等待至少5次战斗事件发生，然后检查战报面板来独立测试。成功标准：战报按时间戳从新到旧排列，没有重复的事件ID。

**Acceptance Scenarios**:

1. **Given** 游戏运行中发生了多次战斗, **When** 玩家打开战报面板, **Then** 战报应该按时间戳降序排列（最新的战斗显示在列表顶部）
2. **Given** 系统添加了新的战报事件, **When** 战报面板刷新, **Then** 新事件应该出现在列表最顶部，旧事件依次下移
3. **Given** 战报列表中存在多个事件, **When** 检查事件ID, **Then** 不应该存在任何重复的事件ID
4. **Given** 同一时刻发生的多个事件, **When** 这些事件按照生成顺序（通过ID或内部序列号）排列, **Then** 应该保持稳定的顺序，不会随机跳动

---

### User Story 2 - 地图领土实时更新 (Priority: P1)

作为玩家，当战斗导致领土易手时，我希望能在地图上实时看到领土的颜色和归属信息更新，这样我可以直观了解各指挥官的势力范围变化。

**Why this priority**: 这是游戏的核心视觉反馈。如果地图不更新，玩家将无法感知游戏进度和征服过程，游戏失去了策略意义。这与战报显示同等重要，共同构成玩家理解游戏状态的基础。

**Independent Test**: 可以通过观察一局完整游戏（5分钟）来独立测试。成功标准：每次战报显示领土易手时，地图上对应国家的颜色应在1秒内更新为新占领者的颜色。

**Acceptance Scenarios**:

1. **Given** 游戏初始化完成，10位指挥官分配到不同国家, **When** 地图首次渲染, **Then** 每个国家应该显示为对应指挥官的颜色
2. **Given** 战斗系统判定某个指挥官占领了新领土, **When** 领土归属（ownerId）发生变化, **Then** 地图上该国家的颜色应立即更新为新占领者的颜色
3. **Given** 地图上某个国家的颜色已更新, **When** 玩家点击该国家查看详情, **Then** 详情面板应显示正确的当前占领者信息
4. **Given** 多个领土在短时间内（5秒内）连续易手, **When** 所有变化都被触发, **Then** 每个领土的颜色更新应该逐个执行，不会被跳过或覆盖

---

### Edge Cases

- **战报时间戳相同**: 如果多个战斗事件在同一毫秒内生成，系统应使用事件ID或生成序列号作为次级排序依据，确保稳定排序
- **快速连续的领土变化**: 当同一领土在极短时间内（如1秒内）多次易手时，地图渲染应该队列化处理每次变化，确保最终状态正确
- **初始化时领土状态缺失**: 如果某些国家在游戏初始化时未正确分配到territoryStates，系统应该记录警告日志并用默认值填充，确保地图能够渲染
- **战报事件ID冲突**: 虽然概率极低，如果生成了重复的事件ID，系统应该在添加前检测并重新生成ID
- **领土更新但地图未订阅**: 如果地图场景未正确订阅store的territoryStates变化，更新将不会触发渲染。需要确保订阅机制正确建立

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 战报系统必须在添加新事件时生成唯一的事件ID，确保不会产生重复记录
- **FR-002**: 战报面板必须按照事件的timestamp字段进行降序排序（最新的在顶部），如果时间戳相同则按事件ID排序
- **FR-003**: 战报列表渲染时必须使用唯一的key值（基于事件ID），防止React渲染时出现重复或顺序错乱
- **FR-004**: 系统必须在battleSystem触发领土占领时，同步更新store中的territoryStates和territories两个状态
- **FR-005**: 地图渲染器（MapRenderer）必须监听territoryStates的变化，并在检测到ownerId变更时立即触发颜色更新
- **FR-006**: WorldScene必须在每个simulation tick中检查领土变化，并调用updateCountry方法更新Phaser图形对象
- **FR-007**: 系统必须确保战报事件的timestamp字段使用统一的时间格式（ISO 8601字符串），并在排序前正确解析为数值进行比较
- **FR-008**: 当领土归属变更时，系统必须触发三个层级的更新：store状态、territoryStates映射表、Phaser场景渲染

### Key Entities

- **BattleEvent**: 战报事件实体
  - `id`: 唯一标识符（string），格式如 `battle-{timestamp}-{random}`
  - `timestamp`: ISO 8601格式的时间戳字符串
  - `type`: 事件类型（attack, alliance, etc.）
  - `narrative`: 战报文本描述
  - 关系：存储在store.eventLog数组中，通过id去重

- **TerritoryState**: 领土状态实体
  - `countryId`: 对应的国家/领土ID
  - `ownerId`: 当前占领者的指挥官ID
  - `previousOwnerId`: 前一个占领者ID（用于颜色过渡）
  - `updatedAt`: 最后更新时间戳（数值）
  - `conqueredAt`: 被占领的时间戳
  - `transitionProgress`: 颜色过渡动画进度（0-1）
  - 关系：存储在store.territoryStates Map中，key为countryId

## Quality Guardrails _(per Constitution)_

- **Code Quality**: 
  - 修复必须遵循现有的TypeScript规范和ESLint配置
  - 所有时间戳处理使用统一的Date对象和ISO字符串转换
  - Map数据结构的更新必须使用不可变模式（创建新Map而非直接修改）
  - 添加必要的类型守卫，确保timestamp和ownerId字段存在且有效

- **Testing Evidence**: 
  - 为战报排序逻辑添加单元测试（使用Vitest），覆盖正序、乱序、时间戳相同等场景
  - 为领土更新流程添加集成测试，验证store → territoryStates → MapRenderer的完整链路
  - 在现有的E2E测试中添加断言，验证战报面板的排序和地图颜色更新
  - 测试覆盖率应达到修改代码的90%以上

- **User Experience**: 
  - 战报排序应该是即时的，不应该有可见的延迟或跳动
  - 地图颜色更新应在1秒内完成，使用平滑的过渡动画（如已实现transitionProgress机制）
  - 如果检测到数据异常（如重复ID），应记录控制台警告但不中断用户体验
  - 修复后应提升"战报理解度"和"领土变化可感知性"两项用户体验指标

- **Performance & Observability**: 
  - 战报排序操作应在5ms内完成（即使有200条记录）
  - 领土更新不应阻塞主渲染循环，保持60 FPS
  - 添加关键日志：战报添加时的ID和timestamp、领土ownerId变化时的前后对比
  - 在性能监控中跟踪战报渲染耗时和地图更新频率

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 玩家在一局游戏（10-15分钟）中查看战报面板时，100%的战报按时间倒序显示，没有任何重复记录
- **SC-002**: 当战斗导致领土易手时，地图上对应国家的颜色在1秒内完成更新，视觉变化清晰可见
- **SC-003**: 在包含20次以上战斗的游戏会话中，战报列表保持稳定排序，没有可见的跳动或重排现象
- **SC-004**: 玩家点击地图上的任意国家时，显示的占领者信息与最新的战报记录一致，准确率100%
- **SC-005**: 修复后，在用户测试中，90%的玩家能够准确追踪最新3次战斗的结果，相比修复前提升50%
- **SC-006**: 系统在控制台日志中不再出现"Territory state not found"或"Duplicate battle event"相关的警告
