// 简单的应用健康检查脚本
import http from 'http';

const checkServer = () => {
  const options = {
    hostname: 'localhost',
    port: 5173,
    path: '/',
    method: 'GET',
    timeout: 3000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ 服务器响应: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      // 检查关键HTML元素
      const checks = {
        'Root元素': data.includes('<div id="root">'),
        'Main脚本': data.includes('/src/main.tsx'),
        '标题': data.includes('<title>'),
      };
      
      console.log('\n📋 页面检查:');
      Object.entries(checks).forEach(([name, passed]) => {
        console.log(`  ${passed ? '✅' : '❌'} ${name}`);
      });
      
      if (Object.values(checks).every(v => v)) {
        console.log('\n🎉 应用看起来正常！');
        console.log('📍 访问: http://localhost:5173');
      } else {
        console.log('\n⚠️  检测到一些问题');
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ 连接失败: ${e.message}`);
    console.log('💡 请确保运行了: pnpm dev');
  });

  req.on('timeout', () => {
    console.error('❌ 请求超时');
    req.destroy();
  });

  req.end();
};

console.log('🔍 检查应用状态...\n');
checkServer();
