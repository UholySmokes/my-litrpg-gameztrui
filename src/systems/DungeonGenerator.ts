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

    // 2. Carve Rooms (Simple Random Walk or Room placement)
    // For brevity, we'll do a simple random placement
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (Math.random() > 0.3) {
          this.map[y][x] = TileType.Floor;
        }
      }
    }

    // 3. Place Entities based on difficulty
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
}