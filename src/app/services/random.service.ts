import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RandomService {
  pickRandom<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick random item from an empty array.');
    }

    const index = Math.floor(Math.random() * items.length);
    return items[index];
  }
}
