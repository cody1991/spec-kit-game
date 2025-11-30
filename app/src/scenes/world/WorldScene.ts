import Phaser from 'phaser';
import { useGameStore } from '@core/state/store';
import type { Territory, HistoricalCommander } from '@core/types';

export class WorldScene extends Phaser.Scene {
  private territoriesGroup!: Phaser.GameObjects.Group;
  private commandersGroup!: Phaser.GameObjects.Group;
  private cameraController!: CameraController;

  constructor() {
    super({ key: 'WorldScene' });
  }

  create(): void {
    this.territoriesGroup = this.add.group();
    this.commandersGroup = this.add.group();

    // 初始化相机控制
    this.cameraController = new CameraController(this);

    // 订阅状态变化
    this.setupStateSubscription();

    // 初始渲染
    this.renderWorld();

    // 更新循环
    this.events.on('postupdate', this.onUpdate, this);
  }

  private setupStateSubscription(): void {
    // 在实际应用中，这里应该订阅 Zustand store 的变化
    // 由于 Phaser 场景的生命周期，我们在 update 中轮询状态
  }

  private renderWorld(): void {
    const state = useGameStore.getState();
    const { territories, commanders } = state;

    // 清空现有对象
    this.territoriesGroup.clear(true, true);
    this.commandersGroup.clear(true, true);

    // 渲染领土
    territories.forEach((territory) => {
      this.renderTerritory(territory);
    });

    // 渲染指挥官标记
    commanders
      .filter((c) => c.status === 'active')
      .forEach((commander) => {
        this.renderCommander(commander, territories);
      });
  }

  private renderTerritory(territory: Territory): void {
    const polygon = new Phaser.GameObjects.Polygon(
      this,
      0,
      0,
      territory.polygon.flat(),
      this.getTerritoryColor(territory),
      0.7
    );
    polygon.setStrokeStyle(2, 0xffffff, 0.5);
    polygon.setInteractive(
      new Phaser.Geom.Polygon(territory.polygon.flat()),
      Phaser.Geom.Polygon.Contains
    );

    polygon.on('pointerdown', () => {
      useGameStore.getState().selectTerritory(territory.id);
    });

    polygon.on('pointerover', () => {
      polygon.setFillStyle(this.getTerritoryColor(territory), 1);
    });

    polygon.on('pointerout', () => {
      polygon.setFillStyle(this.getTerritoryColor(territory), 0.7);
    });

    this.territoriesGroup.add(polygon);

    // 添加领土名称
    const center = this.getPolygonCenter(territory.polygon);
    const text = this.add.text(center[0], center[1], territory.name, {
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    this.territoriesGroup.add(text);
  }

  private renderCommander(commander: HistoricalCommander, territories: Territory[]): void {
    if (commander.controlledTerritories.length === 0) return;

    const firstTerritory = territories.find(
      (t) => t.id === commander.controlledTerritories[0]
    );
    if (!firstTerritory) return;

    const center = this.getPolygonCenter(firstTerritory.polygon);

    // 指挥官标记
    const circle = this.add.circle(center[0], center[1], 12, 0xff0000, 1);
    circle.setStrokeStyle(2, 0xffffff);
    circle.setInteractive();

    circle.on('pointerdown', () => {
      useGameStore.getState().selectCommander(commander.id);
    });

    this.commandersGroup.add(circle);

    // 指挥官名称
    const nameText = this.add.text(center[0], center[1] - 20, commander.name, {
      fontSize: '14px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold',
    });
    nameText.setOrigin(0.5);
    this.commandersGroup.add(nameText);
  }

  private getTerritoryColor(territory: Territory): number {
    if (!territory.ownerId) {
      return 0x444444; // Neutral
    }

    // 根据 ownerId 生成颜色
    const hash = territory.ownerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = (hash * 137.508) % 360; // Golden angle
    return Phaser.Display.Color.HSVToRGB(hue / 360, 0.7, 0.9).color;
  }

  private getPolygonCenter(polygon: number[][]): [number, number] {
    const sumX = polygon.reduce((sum, point) => sum + point[0], 0);
    const sumY = polygon.reduce((sum, point) => sum + point[1], 0);
    return [sumX / polygon.length, sumY / polygon.length];
  }

  private onUpdate(): void {
    // 每帧检查状态变化并更新渲染
    const state = useGameStore.getState();
    if (state.tick % 10 === 0) {
      // 每10 tick 重新渲染一次
      this.renderWorld();
    }
  }

  destroy(): void {
    this.events.off('postupdate', this.onUpdate, this);
    super.destroy();
  }
}

class CameraController {
  private scene: Phaser.Scene;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupControls();
  }

  private setupControls(): void {
    const camera = this.scene.cameras.main;

    // 鼠标拖拽
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;
        camera.scrollX -= deltaX;
        camera.scrollY -= deltaY;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.scene.input.on('pointerup', () => {
      this.isDragging = false;
    });

    // 缩放
    this.scene.input.on('wheel', (pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Phaser.Math.Clamp(camera.zoom * zoomFactor, 0.5, 2);
      camera.setZoom(newZoom);
    });
  }
}
