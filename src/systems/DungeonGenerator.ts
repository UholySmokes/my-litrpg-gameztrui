export enum TileType {
  Wall = '#',
  Floor = '.',
  Enemy = 'E',
  Loot = 'L',
  Start = 'S',
  Exit = '>'
}

export class DungeonGenerator {
  width: number;
  height: number;
  map: string[][];

  constructor(width: number = 20, height: number = 20) {
    this.width = width;
    this.height = height;
    this.map = [];
  }

  generate(difficulty: number): string[][] {
    // 1. Initialize with Walls
    this.map = Array(this.height).fill(null).map(() => Array(this.width).fill(TileType.Wall));

    // 2. Random Fill (Cellular Automata initialization)
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        // 45% chance to be a wall, 55% floor
        this.map[y][x] = Math.random() < 0.45 ? TileType.Wall : TileType.Floor;
      }
    }

    // 3. Smooth Map (Create organic caves)
    for (let i = 0; i < 5; i++) {
      this.smoothMap();
    }

    // 4. Place Entities based on difficulty
    this.placeFeature(TileType.Enemy, 5 + difficulty); // More enemies on higher difficulty
    this.placeFeature(TileType.Loot, 2 + Math.floor(difficulty / 2));
    this.placeFeature(TileType.Start, 1);
    this.placeFeature(TileType.Exit, 1);

    return this.map;
  }

  private placeFeature(type: TileType, count: number) {
    let placed = 0;
    while (placed < count) {
      const x = Math.floor(Math.random() * (this.width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.height - 2)) + 1;

      if (this.map[y][x] === TileType.Floor) {
        this.map[y][x] = type;
        placed++;
      }
    }
  }

  private smoothMap() {
    const newMap = this.map.map(row => [...row]);
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const neighbors = this.getNeighborWallCount(x, y);
        if (neighbors > 4) newMap[y][x] = TileType.Wall;
        else if (neighbors < 4) newMap[y][x] = TileType.Floor;
      }
    }
    this.map = newMap;
  }

  private getNeighborWallCount(gridX: number, gridY: number): number {
    let wallCount = 0;
    for (let neighborY = gridY - 1; neighborY <= gridY + 1; neighborY++) {
      for (let neighborX = gridX - 1; neighborX <= gridX + 1; neighborX++) {
        if (neighborX >= 0 && neighborX < this.width && neighborY >= 0 && neighborY < this.height) {
          if (neighborX !== gridX || neighborY !== gridY) {
            if (this.map[neighborY][neighborX] === TileType.Wall) wallCount++;
          }
        } else {
          wallCount++; // Borders count as walls
        }
      }
    }
    return wallCount;
  }
}