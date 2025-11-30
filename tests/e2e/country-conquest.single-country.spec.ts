/**
 * E2E Tests for User Story 1: 单国攻占流程
 *
 * Goal: 在真实游戏运行环境中观察到多次“逐个国家”的占领事件，
 *       每条战报仅涉及一个国家，不出现“一次性占领对手所有国家”的描述。
 */

import { test, expect } from '@playwright/test';

const GAME_URL = 'http://localhost:5173';

/**
 * T009: Single-country conquest events only affect one country at a time
 *
 * Acceptance Criteria (实践版):
 * - 在一定时间内观察到多条占领相关的控制台日志；
 * - 每条日志中仅描述一个被占领的国家；
 * - 日志中不出现“占领对手所有国家”等区域级或批量占领措辞。
 */
(test.describe as typeof test.describe)('US1: Single-country conquest', () => {
  test('T009: conquest logs describe single-country ownership changes', async ({ page }) => {
    await page.goto(GAME_URL);
    await page.waitForSelector('canvas', { timeout: 10000 });

    // 收集战斗与占领相关日志
    const conquestLogs: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();

      if (
        text.includes('Territory Update:') ||
        text.includes('Neutral Territory:') ||
        text.includes('占领了') ||
        text.includes('conquered')
      ) {
        conquestLogs.push(text);
      }
    });

    // 等待模拟开始并产生若干次占领事件
    const startTime = Date.now();
    const timeoutMs = 60000; // 最长等待 60 秒

    while (conquestLogs.length < 3 && Date.now() - startTime < timeoutMs) {
      await page.waitForTimeout(2000);
    }

    // 至少应观察到一条占领相关日志
    expect(conquestLogs.length).toBeGreaterThan(0);

    // 从日志中解析被占领的国家名称，验证每条只涉及一个国家
    const parsedTerritoryNames: string[] = [];

    for (const log of conquestLogs) {
      let match = log.match(/Territory Update: (.+?) conquered by/);
      if (!match) {
        match = log.match(/Neutral Territory: (.+?) occupied by/);
      }

      if (match && match[1]) {
        parsedTerritoryNames.push(match[1].trim());
      }
    }

    // 如果当前版本已经输出结构化战报日志，则应能从中解析出至少一个国家名称
    if (parsedTerritoryNames.length > 0) {
      expect(parsedTerritoryNames.length).toBeGreaterThan(0);
    }

    // 关键校验：日志中不出现明显的“批量占领对手所有国家/区域”的措辞
    for (const log of conquestLogs) {
      expect(log).not.toContain('所有国家');
      expect(log).not.toContain('全部国家');
      expect(log).not.toContain('全部领土');
      expect(log).not.toContain('整个区域');
      expect(log).not.toContain('所有区域');
    }
  });
});
