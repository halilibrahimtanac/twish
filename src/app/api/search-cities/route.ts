import { NextRequest, NextResponse } from 'next/server';
import { getCitySearcher } from '@/lib/city-search';

export async function GET(request: NextRequest) {
  const searcher = getCitySearcher();

  if (!searcher) {
    return NextResponse.json(
      { error: 'Search service not available' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
  }

  const results = searcher.search(query, { limit: 10 });

  const cities = results.map(result => result.item);

  return NextResponse.json(cities);
}