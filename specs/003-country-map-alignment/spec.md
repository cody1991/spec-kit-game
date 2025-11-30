# Feature Specification: 国家与地图精准对齐

**Feature Branch**: `003-country-map-alignment`  
**Created**: 2025-11-30  
**Status**: Draft  
**Input**: User description: "该项目已经完成了两次的迭代更新了。这一次我们向更加好的展示产品的形态。因为现在看起来页面的展示是非常不符合我们想要的形式的：国家和地图匹配不上"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 准确识别国家位置 (Priority: P1)

作为玩家，我希望看到指挥官占领的国家名称和地图上的实际位置完全对应，这样我才能理解每位指挥官的地理位置和战略态势。

**Why this priority**: 这是本次迭代的核心问题。当前版本中，指挥官被分配到的国家名称（如"中国"）与地图上显示的位置不匹配，导致用户无法理解游戏状态。这是一个严重的可用性问题，直接影响产品的可信度和用户体验。

**Independent Test**: 可以通过对比指挥官信息面板显示的国家名称与地图上该颜色区域的实际位置来测试。成功标准：当指挥官显示"占领中国"时，地图上被该指挥官颜色标记的区域确实是中国的实际地理位置。

**Acceptance Scenarios**:

1. **Given** 秦始皇被分配到中国作为起始领土, **When** 用户查看地图, **Then** 在地图上中国的实际位置（东亚地区，北纬20-53度，东经73-135度）应该被秦始皇的颜色标记
2. **Given** 拿破仑被分配到法国作为起始领土, **When** 用户查看地图, **Then** 在地图上法国的实际位置（西欧地区，北纬43-51度，东经2-8度）应该被拿破仑的颜色标记
3. **Given** 任意指挥官占领了某个国家, **When** 用户点击该指挥官的详情面板查看其控制的国家列表, **Then** 列表中显示的国家名称与地图上该颜色区域的实际地理位置完全匹配
4. **Given** 用户悬停在地图上的某个被占领国家, **When** 提示框显示国家名称和占领者, **Then** 该国家名称应该与该位置的实际地理名称一致（例如，东亚地区显示"中国"，而不是"俄罗斯"）

---

### User Story 2 - 修正国家-指挥官映射逻辑 (Priority: P1)

作为开发者，我需要修正当前的 region-to-country 映射逻辑，确保旧的区域 ID（如 'china', 'russia'）能够正确映射到真实的国家 ID（ISO 3166-1 codes），这样才能保证地图显示的准确性。

**Why this priority**: 这是技术层面的根本问题。当前代码中的 `regionCountryMap` 存在映射错误，导致国家名称和位置不匹配。这是 P1 的技术实现基础，必须首先解决。

**Independent Test**: 可以通过单元测试和集成测试验证映射逻辑。成功标准：每个旧的 region ID 都能正确映射到对应的真实国家 ID，且映射结果可以通过自动化测试验证。

**Acceptance Scenarios**:

1. **Given** 系统加载指挥官数据，某指挥官的 `controlledTerritories` 包含 'china', **When** 执行 region-to-country 映射, **Then** 应该将 'china' 映射到 ISO code '156'（中国的标准国家代码）
2. **Given** 系统加载指挥官数据，某指挥官的 `controlledTerritories` 包含 'western-europe', **When** 执行 region-to-country 映射, **Then** 应该将 'western-europe' 映射到法国（'250'）、德国（'276'）、意大利（'380'）等西欧国家的 ISO codes
3. **Given** 地图数据中某国家的 ID 为 '156', **When** 查询该国家的详细信息, **Then** 返回的国家名称应该是"中国"（或 "China"），且几何边界对应东亚地区
4. **Given** 所有指挥官的领土映射完成, **When** 检查映射结果, **Then** 不应该出现未映射的国家（除非该国家确实无人占领），也不应该出现错误的映射（如中国被映射到欧洲位置）

---

### User Story 3 - 验证和测试国家对齐 (Priority: P2)

作为 QA 工程师，我需要有自动化测试来验证国家名称和地图位置的对齐准确性，确保未来的更新不会破坏这个修复。

**Why this priority**: 这是质量保障的必要措施。虽然不是 MVP 的核心功能，但对于防止回归问题和确保长期代码质量非常重要。应该在 P1 完成后立即实施。

**Independent Test**: 可以通过 E2E 测试和视觉回归测试独立验证。成功标准：测试套件能够自动检测国家名称和地图位置的不匹配，并在 CI 中自动运行。

**Acceptance Scenarios**:

1. **Given** 系统启动并加载地图数据, **When** 运行国家对齐验证测试, **Then** 测试应该验证至少 10 个主要国家（中国、美国、俄罗斯、法国等）的名称和位置是否匹配
2. **Given** 某指挥官占领了特定国家, **When** 运行 E2E 测试点击该国家, **Then** 测试应该验证弹出的详情面板显示的国家名称与点击位置的地理名称一致
3. **Given** 开发者提交了新的代码更改, **When** CI 流水线运行测试, **Then** 如果国家映射逻辑被破坏（如中国被错误映射），测试应该失败并阻止代码合并
4. **Given** 地图渲染完成, **When** 运行视觉回归测试, **Then** 测试应该对比当前渲染结果与基准截图，确保国家边界和颜色标记没有错位

---

### User Story 4 - 提供国家对齐调试工具 (Priority: P3)

作为开发者，我希望有一个调试界面或日志输出，能够清楚地显示每个 region ID 映射到哪些 country IDs，以及每个指挥官占领了哪些真实国家，方便问题排查。

**Why this priority**: 这是开发体验的增强功能。虽然对最终用户不可见，但对于开发和维护非常有帮助。可以在核心功能完成后再实施。

**Independent Test**: 可以通过检查控制台日志和调试面板来独立测试。成功标准：日志清晰展示映射关系，便于快速定位问题。

**Acceptance Scenarios**:

1. **Given** 开发者在浏览器中打开游戏, **When** 打开开发者工具的控制台, **Then** 应该看到清晰的映射日志，例如："秦始皇 -> 中国 (156) ✓"
2. **Given** 系统执行 region-to-country 映射, **When** 映射完成, **Then** 控制台应该输出映射统计信息，例如："成功映射 45 个国家到 10 位指挥官，3 个国家未分配"
3. **Given** 开发者启用调试模式（如 URL 参数 ?debug=true）, **When** 地图渲染完成, **Then** 应该在地图上叠加显示每个国家的 ID 和名称，方便对照验证
4. **Given** 映射过程中出现错误（如某 region ID 无法找到对应国家）, **When** 错误发生, **Then** 控制台应该输出清晰的错误信息和建议修复方案

---

### Edge Cases

- 当某个旧的 region ID 在 `regionCountryMap` 中没有对应的真实国家 ID，如何处理？（警告日志并跳过该 region，不影响其他映射）
- 当某个真实国家 ID（如 '156'）在地图数据文件中不存在（数据损坏或不完整），如何处理？（降级显示该指挥官为"无领土"，并记录错误日志）
- 当多个指挥官的 region 映射到同一个国家 ID（映射冲突），如何处理？（按加载顺序，后加载的覆盖前者，并警告日志）
- 当用户缩放地图到极端级别（非常大或非常小），国家标签和颜色标记是否仍然对齐？（使用相对坐标系统，确保标签跟随国家几何图形缩放）
- 当地图数据使用简化版本（world-countries-simplified.json），国家边界精度降低，是否会影响对齐准确性？（不影响，因为映射基于 country ID 而非几何坐标）

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须建立一个准确的 region-to-country 映射表，将旧的区域 ID（如 'china', 'western-europe', 'russia'）映射到标准的 ISO 3166-1 alpha-3 国家代码（如 '156', '250', '643'）
- **FR-002**: 系统必须在启动时验证映射表的完整性，检查所有 region IDs 是否都有对应的 country IDs，并记录任何缺失或无效的映射
- **FR-003**: 系统必须在指挥官初始化时，根据 `controlledTerritories` 字段中的 region IDs，通过映射表查找对应的真实国家 IDs
- **FR-004**: 系统必须使用真实国家 IDs（而非 region IDs）作为 `territoryStates` Map 的键，确保地图渲染和游戏状态使用统一的标识符
- **FR-005**: 系统必须在地图渲染时，根据 `territoryStates` 中的 country IDs 匹配 `countries` 数组中的对应国家，并用正确的颜色填充该国家的几何边界
- **FR-006**: 系统必须在用户悬停或点击某国家时，显示该国家的真实名称（从 `country.name` 或 `country.nameEn` 字段获取），而非旧的 region ID
- **FR-007**: 系统必须在指挥官详情面板中，显示该指挥官占领的真实国家名称列表，而非 region IDs
- **FR-008**: 系统必须提供一个验证函数，在开发或测试环境中检查所有指挥官的领土分配是否与地图上的显示一致
- **FR-009**: 系统必须在控制台输出映射过程的详细日志，包括每个 region ID 映射到的 country IDs，以及最终的分配统计
- **FR-010**: 系统必须处理映射冲突或缺失的情况，不能因为部分映射错误而导致整个游戏崩溃或地图无法加载

### Key Entities

- **Region-to-Country 映射表 (regionCountryMap)**: 记录旧系统的 region ID（如 'china', 'western-europe'）到新系统的真实国家 ID 列表（ISO 3166-1 codes）的映射关系。映射表应该覆盖当前游戏中使用的所有 15 个旧 region IDs
  - 示例结构：`{ 'china': ['156'], 'western-europe': ['250', '276', '380', '528'], ... }`
  
- **国家验证元数据 (Country Validation Metadata)**: 包含每个国家的预期位置信息（如中心坐标、边界框），用于自动化测试验证国家名称和位置的对齐性
  - 示例：`{ id: '156', expectedName: '中国', expectedCentroid: { x: 105, y: 35 }, expectedBBox: {...} }`

- **国家对齐测试用例 (Country Alignment Test Cases)**: 定义一组关键国家（如中国、美国、法国、俄罗斯等）及其预期占领者，用于 E2E 测试验证映射准确性

## Quality Guardrails *(per Constitution)*

- **Code Quality**: 
  - `regionCountryMap` 映射表必须从代码中抽离到独立的配置文件（如 `regionMapping.config.ts`），便于维护和测试
  - 映射逻辑必须有单元测试，覆盖率要求 100%（因为这是关键的数据转换逻辑）
  - 所有映射函数必须有完整的 TypeScript 类型注解，确保编译时类型安全
  - 代码必须通过 ESLint 和 Prettier 检查

- **Testing Evidence**: 
  - **单元测试**: 测试 `regionCountryMap` 的每个条目是否有效，测试映射函数能正确处理正常输入、边界情况和错误输入
  - **集成测试**: 测试指挥官初始化流程，验证 `controlledTerritories` 中的 region IDs 能正确转换为 country IDs 并存入 `territoryStates`
  - **E2E测试**: 
    - 测试至少 10 个主要国家的名称和位置对齐（中国、美国、俄罗斯、法国、德国、日本、印度、巴西、澳大利亚、南非）
    - 测试点击地图上的中国区域，验证弹出的详情显示"中国"而非其他国家名
    - 测试秦始皇的详情面板，验证其控制的国家列表中包含"中国"且地图上中国区域确实被标记为秦始皇的颜色
  - **视觉回归测试**: 对比修复前后的地图截图，确保国家位置准确且无视觉回归
  - 所有测试必须在 CI 中自动运行，测试失败时阻止代码合并

- **User Experience**: 
  - **准确性**: 100% 的指挥官显示的国家名称与地图位置匹配（零容忍错误）
  - **识别度**: 90% 的用户能够在不查看帮助的情况下，通过地图颜色和国家形状识别出主要国家
  - **一致性**: 游戏内所有显示国家名称的地方（详情面板、提示框、事件日志）都使用真实国家名，且与地图一致
  - **调试友好性**: 开发者能够在 1 分钟内通过控制台日志定位任何国家对齐问题

- **Performance & Observability**: 
  - **性能影响**: 修复映射逻辑不应该显著增加启动时间或运行时性能开销（增量不超过 50ms）
  - **映射验证时间**: 启动时的映射验证和日志输出不应该超过 100ms
  - **可观测性**: 
    - 记录每个 region ID 映射到的 country IDs 数量和名称
    - 记录映射成功率（成功映射的国家数 / 总国家数）
    - 记录任何映射警告或错误，包括缺失的 region IDs、无效的 country IDs、映射冲突
    - 在开发模式下，提供详细的映射过程日志和验证报告

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% 的指挥官占领的国家名称与地图上对应颜色区域的实际地理位置完全匹配，无任何错位或错误标记
- **SC-002**: 在用户测试中，100% 的参与者能够正确识别出秦始皇占领的是中国（东亚位置），拿破仑占领的是法国（西欧位置）
- **SC-003**: E2E 测试套件能够验证至少 10 个关键国家的对齐准确性，且测试通过率达到 100%
- **SC-004**: 控制台日志清晰展示所有 region-to-country 映射关系，开发者能够在 1 分钟内通过日志定位任何对齐问题
- **SC-005**: 国家对齐修复不应该引入新的性能问题，游戏启动时间增量不超过 50ms，地图渲染帧率保持在 60 FPS
- **SC-006**: 修复后的版本在上线 24 小时内，无用户报告国家名称和地图位置不匹配的问题
- **SC-007**: 代码审查中，映射逻辑清晰易懂，新加入的开发者能够在 10 分钟内理解并修改 `regionCountryMap`
- **SC-008**: 视觉回归测试通过，地图上所有国家边界和颜色标记与预期基准一致，无视觉差异

## Assumptions

- 当前游戏中使用的旧 region IDs（如 'china', 'western-europe'）和新的地图数据文件（world-countries.json）中的国家 IDs（ISO 3166-1 codes）都是已知且可获取的
- 地图数据文件（world-countries.json）中包含所有主要国家的准确地理边界和元数据
- 每个旧 region ID 至少对应一个真实国家 ID，可能对应多个国家（如 'western-europe' 对应法国、德国、意大利等）
- 指挥官的 `controlledTerritories` 字段在初始化时使用旧的 region IDs，需要在运行时转换为真实的 country IDs
- 用户能够通过国家的形状和位置识别主要国家（如中国、美国、俄罗斯），即使没有国家名称标签

## Dependencies

- **地图数据文件**: 依赖 `app/public/maps/world-countries.json` 和 `world-countries-simplified.json` 包含准确的国家 ID、名称和几何边界
- **现有指挥官数据**: 依赖 `app/src/data/commandersData.ts` 中定义的指挥官 `controlledTerritories` 字段
- **地图渲染系统**: 依赖 `MapRenderer` 和 `WorldScene` 正确处理基于 country IDs 的渲染
- **状态管理**: 依赖 Zustand store 中的 `territoryStates` Map 使用 country IDs 作为键

## Out of Scope

- 修改地图数据文件中的国家边界或添加新的国家（使用现有数据）
- 重新设计指挥官分配算法或初始领土选择逻辑（仅修复映射关系）
- 添加用户自定义国家映射或动态区域划分功能（固定映射表）
- 优化地图渲染性能或添加新的视觉效果（专注于对齐准确性）
- 国际化支持（如多语言国家名称显示）（暂时只支持中英文）
