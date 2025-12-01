// ============================================
// 🔍 调试脚本 - 在浏览器Console中运行
// ============================================
// 使用方法：
// 1. 打开浏览器开发者工具 (F12 或 Cmd+Option+I)
// 2. 进入 Console 标签
// 3. 复制粘贴本文件全部内容
// 4. 按 Enter 执行
// ============================================

console.log('');
console.log('='.repeat(60));
console.log('🔍 游戏状态诊断开始...');
console.log('='.repeat(60));
console.log('');

// ============================================
// 1. 检查 Zustand Store
// ============================================
console.log('📦 1. 检查 Zustand Store');
console.log('-'.repeat(60));

// 尝试获取store（可能需要从window或全局暴露）
let store = null;

// 方法1: 尝试从React DevTools获取
try {
  // 在开发模式下，可以通过window.__REACT_DEVTOOLS_GLOBAL_HOOK__访问
  const rootElement = document.querySelector('#root');
  if (rootElement && rootElement._reactRootContainer) {
    console.log('✅ 找到React根容器');
  }
} catch (e) {
  console.log('⚠️ 无法直接访问React内部');
}

// 方法2: 检查是否有全局暴露的store引用
if (typeof window !== 'undefined') {
  console.log('✅ Window对象存在');
  
  // 列出所有可能相关的全局变量
  const globalKeys = Object.keys(window).filter(k => 
    k.toLowerCase().includes('store') || 
    k.toLowerCase().includes('game') ||
    k.toLowerCase().includes('zustand')
  );
  
  if (globalKeys.length > 0) {
    console.log('🔎 找到可能相关的全局变量:', globalKeys);
  } else {
    console.log('⚠️ 未找到store相关的全局变量');
  }
}

console.log('');

// ============================================
// 2. 检查 Phaser Game 实例
// ============================================
console.log('🎮 2. 检查 Phaser Game 实例');
console.log('-'.repeat(60));

if (typeof game !== 'undefined') {
  console.log('✅ 全局 game 对象存在');
  console.log('   Game实例类型:', game.constructor.name);
  console.log('   Canvas数量:', game.canvas ? 1 : 0);
  console.log('   运行状态:', game.loop?.running ? '运行中' : '已停止');
  console.log('   FPS:', game.loop?.actualFps?.toFixed(1) || 'N/A');
  
  // 检查场景
  const scenes = game.scene?.getScenes(true) || [];
  console.log('   活动场景数:', scenes.length);
  
  if (scenes.length > 0) {
    console.log('   场景列表:');
    scenes.forEach(s => {
      console.log(`     - ${s.scene.key} (active: ${s.scene.isActive()})`);
    });
    
    // 检查WorldScene
    const worldScene = game.scene.getScene('WorldScene');
    if (worldScene) {
      console.log('');
      console.log('🗺️  WorldScene 详情:');
      console.log('   countries:', worldScene.countries?.length || 0);
      console.log('   mapRenderer:', !!worldScene.mapRenderer);
      console.log('   mapDataLoader:', !!worldScene.mapDataLoader);
      
      if (worldScene.countries && worldScene.countries.length > 0) {
        console.log('   国家数据样本:');
        worldScene.countries.slice(0, 5).forEach(c => {
          console.log(`     - ${c.name} (${c.id}), 面积: ${(c.area / 1000000).toFixed(2)}M km²`);
        });
      } else {
        console.error('   ❌ 国家数据为空！');
      }
      
      // 检查是否过滤了南极洲
      if (worldScene.countries && worldScene.countries.length > 0) {
        const antarctica = worldScene.countries.find(c => 
          c.id === 'ATA' || 
          c.id === '-99' || 
          c.id === '010' ||
          c.name === 'Antarctica' ||
          c.nameEn === 'Antarctica'
        );
        
        if (antarctica) {
          console.error('   ❌ 警告：南极洲仍然存在！', antarctica);
        } else {
          console.log('   ✅ 南极洲已被正确过滤');
        }
      }
    } else {
      console.error('   ❌ WorldScene 不存在');
    }
  }
} else {
  console.error('❌ 全局 game 对象不存在');
  console.log('💡 提示：game对象可能未暴露到全局作用域');
}

console.log('');

// ============================================
// 3. 检查 DOM 元素
// ============================================
console.log('📄 3. 检查 DOM 元素');
console.log('-'.repeat(60));

const canvases = document.querySelectorAll('canvas');
console.log('Canvas元素数量:', canvases.length);

if (canvases.length > 0) {
  canvases.forEach((canvas, i) => {
    console.log(`  Canvas #${i + 1}:`);
    console.log(`    尺寸: ${canvas.width} x ${canvas.height}`);
    console.log(`    显示: ${window.getComputedStyle(canvas).display}`);
    console.log(`    可见性: ${window.getComputedStyle(canvas).visibility}`);
  });
} else {
  console.error('  ❌ 未找到Canvas元素');
}

// 检查排行榜面板
const statsPanel = document.querySelector('.faction-stats-panel');
if (statsPanel) {
  console.log('');
  console.log('📊 排行榜面板:');
  console.log('  ✅ DOM元素存在');
  console.log('  显示:', window.getComputedStyle(statsPanel).display);
  
  const rows = statsPanel.querySelectorAll('.leaderboard-row');
  console.log('  数据行数:', rows.length);
  
  if (rows.length === 0) {
    const emptyMsg = statsPanel.querySelector('.empty-message');
    if (emptyMsg) {
      console.warn('  ⚠️ 显示「暂无数据」');
    }
  } else {
    console.log('  ✅ 有数据显示');
  }
} else {
  console.log('');
  console.log('📊 排行榜面板:');
  console.log('  ⚠️ DOM元素不存在（可能未打开，按S键打开）');
}

console.log('');

// ============================================
// 4. 检查 LocalStorage / IndexedDB
// ============================================
console.log('💾 4. 检查缓存数据');
console.log('-'.repeat(60));

// 检查地图数据缓存
if ('indexedDB' in window) {
  console.log('✅ IndexedDB 可用');
  
  // 尝试打开map-data-cache数据库
  const dbRequest = indexedDB.open('map-data-cache');
  
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    console.log('  数据库:', db.name, '版本:', db.version);
    console.log('  对象存储:', Array.from(db.objectStoreNames));
    db.close();
  };
  
  dbRequest.onerror = () => {
    console.log('  ⚠️ 无法打开map-data-cache数据库（可能不存在）');
  };
} else {
  console.warn('⚠️ IndexedDB 不可用');
}

console.log('');

// ============================================
// 5. 网络请求检查
// ============================================
console.log('🌐 5. 网络请求建议');
console.log('-'.repeat(60));
console.log('请手动检查以下内容：');
console.log('1. 打开 Network 标签');
console.log('2. 查找 /maps/world-countries.json 请求');
console.log('3. 检查状态码是否为 200');
console.log('4. 检查响应大小（应该 > 1MB）');
console.log('5. 预览响应内容，确认是有效的JSON');

console.log('');

// ============================================
// 6. 控制台日志检查
// ============================================
console.log('📝 6. 关键日志检查清单');
console.log('-'.repeat(60));
console.log('在Console中查找以下日志（滚动到顶部）：');
console.log('');
console.log('✓ 应该看到：');
console.log('  - 🌍 Creating initial world with XXX countries');
console.log('  - ✅ Set XXX countries to store');
console.log('  - 📊 FactionStatsService started');
console.log('  - 🚫 Filtered out Antarctica');
console.log('  - ✅ Loaded XXX countries');
console.log('');
console.log('✗ 不应该看到：');
console.log('  - ❌ 任何错误信息');
console.log('  - ⚠️ countries not loaded yet (反复出现)');
console.log('  - ⚠️ Country not found for territoryId');

console.log('');

// ============================================
// 7. 手动修复建议
// ============================================
console.log('🔧 7. 故障排除步骤');
console.log('-'.repeat(60));
console.log('如果仍有问题，按以下顺序尝试：');
console.log('');
console.log('步骤1: 清除缓存');
console.log('  - Application → Storage → Clear site data');
console.log('  - 或直接硬刷新：Cmd+Shift+R (Mac) / Ctrl+Shift+R (Win)');
console.log('');
console.log('步骤2: 检查构建');
console.log('  - 终端运行：pnpm build');
console.log('  - 确认无TypeScript错误');
console.log('');
console.log('步骤3: 重启开发服务器');
console.log('  - 终端按 Ctrl+C 停止');
console.log('  - 运行：npm run dev');
console.log('  - 等待编译完成后刷新浏览器');
console.log('');
console.log('步骤4: 查看详细日志');
console.log('  - 确保Console显示所有级别日志（Info、Warn、Error）');
console.log('  - 不要过滤任何消息');

console.log('');
console.log('='.repeat(60));
console.log('🔍 诊断完成');
console.log('='.repeat(60));
console.log('');
console.log('💡 提示：将上述输出截图发送给开发者');
console.log('');
