// 🔍 地图诊断脚本
// 在浏览器控制台（F12）中运行此脚本

console.log('=== 🗺️ 地图诊断开始 ===');

// 1. 检查 Phaser 实例
const game = window.game;
if (!game) {
  console.error('❌ Game instance not found!');
} else {
  console.log('✅ Game instance found');
}

// 2. 检查 WorldScene
const scene = game.scene.getScene('WorldScene');
if (!scene) {
  console.error('❌ WorldScene not found!');
} else {
  console.log('✅ WorldScene found');
  
  // 3. 检查地图数据
  console.log('\n📦 地图数据:');
  console.log(`  - Countries loaded: ${scene.countries?.length || 0}`);
  console.log(`  - Countries in registry: ${scene.registry.get('countries')?.length || 0}`);
  
  // 4. 检查渲染器
  console.log('\n🎨 渲染器状态:');
  if (!scene.mapRenderer) {
    console.error('  ❌ MapRenderer not initialized!');
  } else {
    const stats = scene.mapRenderer.getStats();
    console.log(`  - Countries rendered: ${stats.countriesRendered}`);
    console.log(`  - Render time: ${stats.renderTime.toFixed(2)}ms`);
    console.log(`  - Draw calls: ${stats.drawCalls}`);
    console.log(`  - Vertices: ${stats.vertices}`);
  }
  
  // 5. 检查 game store
  console.log('\n🏪 Game Store:');
  const store = window.__GAME_STORE__;
  if (!store) {
    console.error('  ❌ Game store not found!');
  } else {
    const state = store.getState();
    console.log(`  - Game started: ${state.gameStarted}`);
    console.log(`  - Countries in store: ${state.countries?.length || 0}`);
    console.log(`  - Commanders: ${state.commanders?.length || 0}`);
    console.log(`  - Active commanders: ${state.commanders?.filter(c => c.status === 'active')?.length || 0}`);
  }
  
  // 6. 检查 territoryStates
  console.log('\n🗺️ Territory States:');
  const territoryStates = scene.registry.get('territoryStates');
  if (!territoryStates) {
    console.error('  ❌ Territory states not found!');
  } else {
    console.log(`  - Total territories: ${territoryStates.size}`);
    let withOwner = 0;
    let withoutOwner = 0;
    territoryStates.forEach((state) => {
      if (state.ownerId) {
        withOwner++;
      } else {
        withoutOwner++;
      }
    });
    console.log(`  - With owner: ${withOwner}`);
    console.log(`  - Without owner: ${withoutOwner}`);
  }
  
  // 7. 检查 Graphics 对象
  console.log('\n🎮 Graphics 对象:');
  if (scene.mapRenderer) {
    const graphicsCount = scene.mapRenderer.countryGraphics?.size || 0;
    const labelsCount = scene.mapRenderer.countryLabels?.size || 0;
    console.log(`  - Country graphics: ${graphicsCount}`);
    console.log(`  - Country labels: ${labelsCount}`);
  }
  
  // 8. 采样显示几个国家信息
  console.log('\n📍 采样国家数据:');
  if (scene.countries && scene.countries.length > 0) {
    const samples = [
      scene.countries.find(c => c.id === '156'), // China
      scene.countries.find(c => c.id === '840'), // USA
      scene.countries.find(c => c.id === '643'), // Russia
      scene.countries.find(c => c.id === '250'), // France
    ].filter(Boolean);
    
    samples.forEach((country) => {
      const state = territoryStates?.get(country.id);
      console.log(`  ${country.name} (${country.id}):`);
      console.log(`    - Has geometry: ${!!country.geometry}`);
      console.log(`    - Owner: ${state?.ownerId || 'none'}`);
      console.log(`    - Bbox: [${country.bbox.minX.toFixed(1)}, ${country.bbox.minY.toFixed(1)}, ${country.bbox.maxX.toFixed(1)}, ${country.bbox.maxY.toFixed(1)}]`);
    });
  }
}

console.log('\n=== 🏁 诊断完成 ===');
console.log('\n💡 提示：如果看到问题，请将上述输出截图发送给开发者');
