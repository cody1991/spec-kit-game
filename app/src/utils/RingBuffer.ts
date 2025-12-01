/**
 * RingBuffer - 环形缓冲区实现
 *
 * 用于替代数组实现事件日志，避免频繁的数组复制操作。
 * 特点：
 * - O(1) 时间复杂度添加元素
 * - 固定内存占用，不会持续增长
 * - 自动覆盖最旧元素
 *
 * @performance
 * - push: O(1)
 * - toArray: O(n)
 * - clear: O(1)
 */
export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private _size: number = 0;
  private readonly _capacity: number;

  constructor(capacity: number) {
    if (capacity <= 0 || !Number.isInteger(capacity)) {
      throw new Error('RingBuffer capacity must be a positive integer');
    }
    this._capacity = capacity;
    this.buffer = new Array(capacity);
  }

  /**
   * 最大容量
   */
  get capacity(): number {
    return this._capacity;
  }

  /**
   * 当前元素数量
   */
  get size(): number {
    return this._size;
  }

  /**
   * 缓冲区是否为空
   */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * 缓冲区是否已满
   */
  get isFull(): boolean {
    return this._size === this._capacity;
  }

  /**
   * 添加元素到缓冲区
   * 如果缓冲区已满，会覆盖最旧的元素
   *
   * @param item - 要添加的元素
   * @returns 被覆盖的元素（如果有）
   */
  push(item: T): T | undefined {
    const overwritten = this.isFull ? this.buffer[this.head] : undefined;

    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this._capacity;

    if (this._size < this._capacity) {
      this._size++;
    }

    return overwritten;
  }

  /**
   * 批量添加元素
   *
   * @param items - 要添加的元素数组
   */
  pushMany(items: T[]): void {
    for (const item of items) {
      this.push(item);
    }
  }

  /**
   * 获取最新的元素（最后添加的）
   */
  peek(): T | undefined {
    if (this._size === 0) return undefined;
    const index = (this.head - 1 + this._capacity) % this._capacity;
    return this.buffer[index];
  }

  /**
   * 获取最旧的元素（最先添加的）
   */
  peekOldest(): T | undefined {
    if (this._size === 0) return undefined;
    const startIndex = this._size < this._capacity ? 0 : this.head;
    return this.buffer[startIndex];
  }

  /**
   * 获取指定索引的元素（0 = 最旧，size-1 = 最新）
   *
   * @param index - 逻辑索引
   */
  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) {
      return undefined;
    }

    const startIndex = this._size < this._capacity ? 0 : this.head;
    const actualIndex = (startIndex + index) % this._capacity;
    return this.buffer[actualIndex];
  }

  /**
   * 转换为数组（按添加顺序，最旧在前）
   *
   * @returns 元素数组的副本
   */
  toArray(): T[] {
    if (this._size === 0) return [];

    const result: T[] = new Array(this._size);
    const startIndex = this._size < this._capacity ? 0 : this.head;

    for (let i = 0; i < this._size; i++) {
      const actualIndex = (startIndex + i) % this._capacity;
      result[i] = this.buffer[actualIndex] as T;
    }

    return result;
  }

  /**
   * 获取最新的 n 个元素（按添加顺序，最旧在前）
   *
   * @param n - 要获取的元素数量
   */
  getLatest(n: number): T[] {
    if (n <= 0 || this._size === 0) return [];

    const count = Math.min(n, this._size);
    const result: T[] = new Array(count);
    const startOffset = this._size - count;
    const startIndex = this._size < this._capacity ? 0 : this.head;

    for (let i = 0; i < count; i++) {
      const actualIndex = (startIndex + startOffset + i) % this._capacity;
      result[i] = this.buffer[actualIndex] as T;
    }

    return result;
  }

  /**
   * 清空缓冲区
   */
  clear(): void {
    this.buffer = new Array(this._capacity);
    this.head = 0;
    this._size = 0;
  }

  /**
   * 遍历所有元素（从最旧到最新）
   *
   * @param callback - 回调函数
   */
  forEach(callback: (item: T, index: number) => void): void {
    if (this._size === 0) return;

    const startIndex = this._size < this._capacity ? 0 : this.head;

    for (let i = 0; i < this._size; i++) {
      const actualIndex = (startIndex + i) % this._capacity;
      callback(this.buffer[actualIndex] as T, i);
    }
  }

  /**
   * 迭代器支持
   */
  *[Symbol.iterator](): Iterator<T> {
    if (this._size === 0) return;

    const startIndex = this._size < this._capacity ? 0 : this.head;

    for (let i = 0; i < this._size; i++) {
      const actualIndex = (startIndex + i) % this._capacity;
      yield this.buffer[actualIndex] as T;
    }
  }
}
