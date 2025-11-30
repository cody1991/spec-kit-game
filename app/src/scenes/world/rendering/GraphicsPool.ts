/**
 * Graphics Object Pool
 *
 * Reuses Phaser Graphics objects to avoid frequent creation/destruction
 * and reduce garbage collection pressure.
 */

export class GraphicsPool {
  private pool: Phaser.GameObjects.Graphics[] = [];
  private scene: Phaser.Scene;
  private readonly maxSize: number;
  private inUseCount = 0;

  constructor(scene: Phaser.Scene, maxSize = 200) {
    this.scene = scene;
    this.maxSize = maxSize;
  }

  /**
   * Acquire a Graphics object from the pool
   */
  acquire(): Phaser.GameObjects.Graphics {
    let graphics: Phaser.GameObjects.Graphics;

    if (this.pool.length > 0) {
      graphics = this.pool.pop()!;
      graphics.setVisible(true);
    } else {
      graphics = this.scene.add.graphics();
    }

    this.inUseCount++;
    return graphics;
  }

  /**
   * Return a Graphics object to the pool
   */
  release(graphics: Phaser.GameObjects.Graphics): void {
    if (this.pool.length < this.maxSize) {
      graphics.clear();
      graphics.setVisible(false);
      this.pool.push(graphics);
      this.inUseCount--;
    } else {
      // Pool is full, destroy the object
      graphics.destroy();
      this.inUseCount--;
    }
  }

  /**
   * Get pool status
   */
  getStatus(): { total: number; available: number; inUse: number } {
    return {
      total: this.pool.length + this.inUseCount,
      available: this.pool.length,
      inUse: this.inUseCount,
    };
  }

  /**
   * Clear and destroy all pooled objects
   */
  clear(): void {
    this.pool.forEach((graphics) => graphics.destroy());
    this.pool = [];
    this.inUseCount = 0;
  }

  /**
   * Pre-warm the pool by creating objects in advance
   */
  prewarm(count: number): void {
    const numToCreate = Math.min(count, this.maxSize) - this.pool.length;

    for (let i = 0; i < numToCreate; i++) {
      const graphics = this.scene.add.graphics();
      graphics.setVisible(false);
      this.pool.push(graphics);
    }
  }
}
