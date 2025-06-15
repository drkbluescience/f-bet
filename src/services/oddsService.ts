import { supabase } from './supabaseClient';
import { OddsSnapshot, Bookmaker, BetMarket } from '@/types';

export class OddsService {
  /**
   * Get odds for a specific fixture
   */
  static async getFixtureOdds(fixtureId: number): Promise<OddsSnapshot[]> {
    const { data, error } = await supabase
      .from('odds_snapshots')
      .select(`
        *,
        bookmaker:bookmakers(
          bookmaker_id,
          name,
          country
        ),
        bet_market:bet_markets(
          bet_id,
          name
        )
      `)
      .eq('fixture_id', fixtureId)
      .eq('live', false)
      .order('recorded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch fixture odds: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get live odds for a specific fixture
   */
  static async getLiveOdds(fixtureId: number): Promise<OddsSnapshot[]> {
    const { data, error } = await supabase
      .from('odds_snapshots')
      .select(`
        *,
        bookmaker:bookmakers(
          bookmaker_id,
          name,
          country
        ),
        bet_market:bet_markets(
          bet_id,
          name
        )
      `)
      .eq('fixture_id', fixtureId)
      .eq('live', true)
      .order('recorded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch live odds: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get odds by bet market type
   */
  static async getOddsByMarket(
    fixtureId: number,
    betMarketId: number
  ): Promise<OddsSnapshot[]> {
    const { data, error } = await supabase
      .from('odds_snapshots')
      .select(`
        *,
        bookmaker:bookmakers(
          bookmaker_id,
          name,
          country
        ),
        bet_market:bet_markets(
          bet_id,
          name
        )
      `)
      .eq('fixture_id', fixtureId)
      .eq('bet_id', betMarketId)
      .order('odds', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch odds by market: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get best odds for a fixture across all bookmakers
   */
  static async getBestOdds(fixtureId: number): Promise<{
    home: OddsSnapshot | null;
    draw: OddsSnapshot | null;
    away: OddsSnapshot | null;
  }> {
    // Assuming bet_id 1 is for Match Winner market
    const { data, error } = await supabase
      .from('odds_snapshots')
      .select(`
        *,
        bookmaker:bookmakers(
          bookmaker_id,
          name,
          country
        ),
        bet_market:bet_markets(
          bet_id,
          name
        )
      `)
      .eq('fixture_id', fixtureId)
      .eq('bet_id', 1) // Match Winner market
      .eq('live', false)
      .order('odds', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch best odds: ${error.message}`);
    }

    const odds = data || [];
    
    // Group by outcome type (this would need to be enhanced based on actual data structure)
    // For now, assuming we have different records for home/draw/away
    const homeOdds = odds.filter(o => o.odds && o.odds > 1.0).sort((a, b) => (b.odds || 0) - (a.odds || 0));
    
    return {
      home: homeOdds[0] || null,
      draw: homeOdds[1] || null,
      away: homeOdds[2] || null,
    };
  }

  /**
   * Get all available bookmakers
   */
  static async getBookmakers(): Promise<Bookmaker[]> {
    const { data, error } = await supabase
      .from('bookmakers')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch bookmakers: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all available bet markets
   */
  static async getBetMarkets(): Promise<BetMarket[]> {
    const { data, error } = await supabase
      .from('bet_markets')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch bet markets: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get odds history for a fixture
   */
  static async getOddsHistory(
    fixtureId: number,
    bookmarkerId?: number,
    betMarketId?: number
  ): Promise<OddsSnapshot[]> {
    let query = supabase
      .from('odds_snapshots')
      .select(`
        *,
        bookmaker:bookmakers(
          bookmaker_id,
          name,
          country
        ),
        bet_market:bet_markets(
          bet_id,
          name
        )
      `)
      .eq('fixture_id', fixtureId)
      .order('recorded_at', { ascending: true });

    if (bookmarkerId) {
      query = query.eq('bookmaker_id', bookmarkerId);
    }

    if (betMarketId) {
      query = query.eq('bet_id', betMarketId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch odds history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get odds comparison across bookmakers
   */
  static async getOddsComparison(
    fixtureId: number,
    betMarketId: number
  ): Promise<{
    bookmaker: Bookmaker;
    odds: number;
    overround: number;
  }[]> {
    const { data, error } = await supabase
      .from('odds_snapshots')
      .select(`
        odds,
        overround,
        bookmaker:bookmakers(
          bookmaker_id,
          name,
          country
        )
      `)
      .eq('fixture_id', fixtureId)
      .eq('bet_id', betMarketId)
      .eq('live', false)
      .not('odds', 'is', null)
      .order('odds', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch odds comparison: ${error.message}`);
    }

    return data?.map(item => ({
      bookmaker: item.bookmaker,
      odds: item.odds || 0,
      overround: item.overround || 0,
    })) || [];
  }

  /**
   * Subscribe to real-time odds updates
   */
  static subscribeToOddsUpdates(
    fixtureId: number,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`odds-${fixtureId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'odds_snapshots',
          filter: `fixture_id=eq.${fixtureId}`,
        },
        callback
      )
      .subscribe();
  }

  /**
   * Get trending odds (most active betting markets)
   */
  static async getTrendingOdds(limit: number = 10): Promise<{
    fixture_id: number;
    bet_market: string;
    activity_count: number;
  }[]> {
    // This would require a more complex query or view
    // For now, return recent odds activity
    const { data, error } = await supabase
      .from('odds_snapshots')
      .select(`
        fixture_id,
        bet_market:bet_markets(name),
        recorded_at
      `)
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch trending odds: ${error.message}`);
    }

    // Group by fixture and bet market to simulate activity count
    const grouped = (data || []).reduce((acc: any, item) => {
      const key = `${item.fixture_id}-${item.bet_market?.name}`;
      if (!acc[key]) {
        acc[key] = {
          fixture_id: item.fixture_id,
          bet_market: item.bet_market?.name || 'Unknown',
          activity_count: 0,
        };
      }
      acc[key].activity_count++;
      return acc;
    }, {});

    return Object.values(grouped).slice(0, limit);
  }
}
