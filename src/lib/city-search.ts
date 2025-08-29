import Fuse, { type IFuseOptions } from 'fuse.js';
import fs from 'fs';
import path from 'path';

export type City = {
  id: string;
  name: string;
  country: string;
  admin1: string;
  lat: string;
  lon: string;
  pop: string;
};

let fuse: Fuse<City> | null = null;

const initializeFuse = () => {
  console.log('Initializing Fuse.js index...');
  try {
    const jsonPath = path.join(process.cwd(), 'src/lib/data/cities500.json');
    const citiesJson = fs.readFileSync(jsonPath, 'utf-8');
    const cities: City[] = JSON.parse(citiesJson);

    const options: IFuseOptions<City> = {
      keys: [
        { name: 'name', weight: 3 },
        { name: 'admin1', weight: 2 },
        { name: 'country', weight: 1 },
      ],
      includeScore: true,
      threshold: 0.3,
      minMatchCharLength: 2,
    };

    fuse = new Fuse(cities, options);
    console.log(`✅ Fuse.js index initialized with ${cities.length} cities.`);

  } catch (error) {
    console.error('❌ Failed to initialize Fuse.js index:', error);
  }
};

export const getCitySearcher = (): Fuse<City> | null => {
  if (!fuse) {
    initializeFuse();
  }
  return fuse;
};