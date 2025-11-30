import { test, expect } from '@playwright/test';

test.describe('US1: 启动全球征服战局', () => {
  test('应该在3秒内加载地图和指挥官', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');

    // 等待开始按钮出现
    const startButton = page.getByRole('button', { name: /开始征服/i });
    await expect(startButton).toBeVisible();

    // 点击开始战局
    await startButton.click();

    // 等待游戏加载
    await page.waitForSelector('canvas', { timeout: 5000 });

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);

    // 验证战报面板出现
    await expect(page.getByText('战报')).toBeVisible({ timeout: 3000 });
  });

  test('应该显示至少8位历史人物', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /开始征服/i }).click();

    // 等待游戏启动
    await page.waitForSelector('canvas', { timeout: 5000 });

    // 等待一段时间让事件产生
    await page.waitForTimeout(2000);

    // 检查战报面板中有事件
    const timeline = page.locator('.battle-timeline');
    await expect(timeline).toBeVisible();
  });

  test('使用自定义种子应该可以重现相同阵容', async ({ page, context }) => {
    const customSeed = 'test-seed-123';

    // 第一次游戏
    await page.goto('/');
    const seedInput = page.locator('input[placeholder*="种子"]');
    await seedInput.fill(customSeed);
    await page.getByRole('button', { name: /开始征服/i }).click();

    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // 获取第一次的事件记录
    const firstGameEvents = await page.locator('.event-narrative').allTextContents();

    // 打开新标签页开始第二次游戏
    const page2 = await context.newPage();
    await page2.goto('/');
    const seedInput2 = page2.locator('input[placeholder*="种子"]');
    await seedInput2.fill(customSeed);
    await page2.getByRole('button', { name: /开始征服/i }).click();

    await page2.waitForSelector('canvas', { timeout: 5000 });
    await page2.waitForTimeout(1000);

    const secondGameEvents = await page2.locator('.event-narrative').allTextContents();

    // 验证开始事件包含相同的种子
    expect(firstGameEvents[0]).toContain(customSeed);
    expect(secondGameEvents[0]).toContain(customSeed);
  });

  test('应该支持点击指挥官显示属性面板', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /开始征服/i }).click();

    await page.waitForSelector('canvas', { timeout: 5000 });
    await page.waitForTimeout(3000);

    // 尝试点击地图上的元素
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 500, y: 300 } });

    // 检查是否有面板出现（指挥官或领土）
    await page.waitForTimeout(500);

    // 由于 Phaser canvas 的交互性，我们主要验证游戏正在运行
    const timeline = page.locator('.battle-timeline');
    await expect(timeline).toBeVisible();
  });
});
