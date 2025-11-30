# Phase 0 Research — Historic World Conquest Simulator

## Task 1: Research世界地图渲染与缩放方案（Phaser + d3-geo）

- **Decision**: 采用 Natural Earth 1:110m 多边形数据 → `mapshaper` 预处理为 TopoJSON，并用 `topojson-client` + `d3-geo` (Equal Earth 投影) 离线转换成 Phaser Polygon 数据；地图与海洋做分层，配合 Phaser 相机的平滑缩放（0.5x–2.5x）与惯性拖拽。
- **Rationale**: Natural Earth 数据免费、无商业限制，TopoJSON 可显著减小传输体积；Equal Earth 投影能保持面积关系，利于显示领土占比；Phaser polygon 支持 hitArea，方便领土选择；离线预处理避免在客户端进行重度简化，保证 <3s 首屏。
- **Alternatives considered**:
  1. **Mapbox GL JS**：需联网加载瓦片、授权复杂且与 Phaser 双引擎冲突。
  2. **Canvas 自绘 GeoJSON**：缺乏内建相机与事件系统，需重复造轮子。
  3. **Three.js 球体**：视觉炫酷但实现成本高且与 2D UI/交互要求不符。

## Task 2: Research 历史人物属性建模与随机生成策略

- **Decision**: 构建 `HistoricalCommander` 数据表，字段包括基础信息 + 四项核心属性（攻、防、机动、统御力 0–100）+ 1–2 个被动技能；初始数据来自公共百科并进行 z-score 标准化，然后映射到 60±15 范围；开局时通过加权采样保证洲别覆盖，并对属性附加 ±10% 随机扰动以提高重玩性。
- **Rationale**: 规范化后方便在模拟中直接比较；技能数量受限以控制 UI 与平衡复杂度；加权采样可避免全部角色集中在同一洲；随机扰动可形成“同一人物但本局略有差异”的体验。
- **Alternatives considered**:
  1. **全随机属性**：缺少历史感，难以营销“历史人物”卖点。
  2. **完全固定属性无扰动**：重玩价值低，且容易形成最优策略。
  3. **复杂技能树**：超出首版本范围，调优成本过高。

## Task 3: Research 战斗/占领模拟架构

- **Decision**: 采用固定 1.5s Tick Scheduler，内含 5 个系统（Recon、Aggression、BattleResolution、Logistics、EventDirector）；BattleResolution 计算公式为 `胜率 = sigmoid((AttackerPower - DefenderPower + TerrainBonus - DistancePenalty)/K)`，并支持技能 Hook；若 5 分钟未有占领变化，则 EventDirector 触发“决战事件”提升 Aggression 值或制造自然灾害以打破僵持。
- **Rationale**: 固定节拍便于录制/回放，1.5s tick 兼顾观感与性能；系统化拆分方便测试；sigmoid 让属性差距映射到概率，保证结果可预测；决战事件满足规格中“僵持时自动提升冲突”的需求。
- **Alternatives considered**:
  1. **实时帧级更新**：过于频繁，难以与 UI 同步。
  2. **完全离散事件模拟**：难以对玩家展示进度条式倒计时。
  3. **纯随机掷骰**：缺少属性对结果的可解释性。

## Task 4: Research Phaser + React Overlay 集成最佳实践

- **Decision**: Phaser 游戏实例挂载在 `app/src/scenes/world`，通过 `exposePhaserAPI()` 将可观察数据推送到 Zustand Store；React UI 监听 store state 并仅读取字段，不直接操作 Phaser；使用 `postMessage`-like 轻量事件桥或 store action 触发（如“聚焦至某领土”），确保渲染主循环不被 React 重新渲染阻塞。
- **Rationale**: 解耦渲染与 UI，防止 React diff 影响 Phaser 帧率；Zustand 支持 subscribeWithSelector，减少不必要更新；单向数据流更易测试。
- **Alternatives considered**:
  1. **在 React 中完全托管 Phaser Canvas**：组件更新会导致 Canvas 重建，性能与状态管理复杂。
  2. **自研事件总线**：Zustand 已满足需求且具备良好 DevTools。

## Task 5: Research 战局持久化与恢复策略

- **Decision**: 使用 IndexedDB `historic-conquest` 数据库，两个 object store：`runs`（最新战局状态快照，每 30s + 关键事件后写入）与 `seeds`（历史随机种子）；快照内容为 WorldState + BattleEvent 索引，压缩为 JSON + LZ-String。页面恢复时先加载最新快照，若失败则回退到战报重放模式。
- **Rationale**: IndexedDB 异步且容量大，适合存储 200+ 事件；分 store 便于管理；定期写入 + 关键事件写可减少数据丢失；压缩减小存储足迹。
- **Alternatives considered**:
  1. **localStorage**：容量/同步限制，不适合频繁写入。
  2. **Service Worker Cache**：更适合静态资源，不便随机读写。
  3. **云端存储**：违背“纯前端”约束。

---

所有研究项已形成可执行决策，暂无剩余 NEEDS CLARIFICATION。
