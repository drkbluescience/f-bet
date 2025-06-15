import { supabase } from './supabaseClient';
import { FixturePrediction, Fixture } from '@/types';

// Mock predictions data
const mockPredictions: FixturePrediction[] = [
  {
    fixture_id: 1,
    prob_home: 0.75,
    prob_draw: 0.20,
    prob_away: 0.05,
    model_version: 'v1.0',
    created_at: new Date().toISOString(),
    fixture: {
      fixture_id: 1,
      league_id: 39,
      season_year: 2024,
      date_utc: new Date().toISOString(),
      status: 'LIVE',
      home_team_id: 1,
      away_team_id: 2,
      venue_id: 1,
      referee: 'John Doe',
      home_goals: 1,
      away_goals: 0,
      updated_at: new Date().toISOString(),
      home_team: { team_id: 1, name: 'Arsenal', logo_url: '', created_at: '', updated_at: '' },
      away_team: { team_id: 2, name: 'Chelsea', logo_url: '', created_at: '', updated_at: '' },
      league: { league_id: 39, name: 'Premier League', country_id: 1, season_year: 2024, created_at: '', updated_at: '' }
    }
  },
  {
    fixture_id: 2,
    prob_home: 0.45,
    prob_draw: 0.30,
    prob_away: 0.25,
    model_version: 'v1.0',
    created_at: new Date().toISOString(),
    fixture: {
      fixture_id: 2,
      league_id: 39,
      season_year: 2024,
      date_utc: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'NS',
      home_team_id: 3,
      away_team_id: 4,
      venue_id: 2,
      referee: 'Jane Smith',
      home_goals: null,
      away_goals: null,
      updated_at: new Date().toISOString(),
      home_team: { team_id: 3, name: 'Manchester United', logo_url: '', created_at: '', updated_at: '' },
      away_team: { team_id: 4, name: 'Liverpool', logo_url: '', created_at: '', updated_at: '' },
      league: { league_id: 39, name: 'Premier League', country_id: 1, season_year: 2024, created_at: '', updated_at: '' }
    }
  }
];

export class PredictionsService {
  /**
   * Get prediction for a specific fixture
   */
  static async getFixturePrediction(fixtureId: number): Promise<FixturePrediction | null> {
    const { data, error } = await supabase
      .from('fixture_predictions')
      .select(`
        *,
        fixture:fixtures(
          fixture_id,
          date_utc,
          status,
          home_team:teams!fixtures_home_team_id_fkey(
            team_id,
            name,
            logo_url
          ),
          away_team:teams!fixtures_away_team_id_fkey(
            team_id,
            name,
            logo_url
          ),
          league:leagues(
            league_id,
            name,
            logo_url
          )
        )
      `)
      .eq('fixture_id', fixtureId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No prediction found
        return null;
      }
      throw new Error(`Failed to fetch fixture prediction: ${error.message}`);
    }

    return data;
  }

  /**
   * Get predictions for multiple fixtures
   */
  static async getFixturePredictions(
    fixtureIds: number[]
  ): Promise<FixturePrediction[]> {
    const { data, error } = await supabase
      .from('fixture_predictions')
      .select(`
        *,
        fixture:fixtures(
          fixture_id,
          date_utc,
          status,
          home_team:teams!fixtures_home_team_id_fkey(
            team_id,
            name,
            logo_url
          ),
          away_team:teams!fixtures_away_team_id_fkey(
            team_id,
            name,
            logo_url
          ),
          league:leagues(
            league_id,
            name,
            logo_url
          )
        )
      `)
      .in('fixture_id', fixtureIds);

    if (error) {
      throw new Error(`Failed to fetch fixture predictions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get recent predictions with high confidence
   */
  static async getHighConfidencePredictions(
    limit: number = 10,
    minConfidence: number = 0.7
  ): Promise<FixturePrediction[]> {
    try {
      const { data, error } = await supabase
        .from('fixture_predictions')
        .select(`
          *,
          fixture:fixtures(
            fixture_id,
            date_utc,
            status,
            home_team:teams!fixtures_home_team_id_fkey(
              team_id,
              name,
              logo_url
            ),
            away_team:teams!fixtures_away_team_id_fkey(
              team_id,
              name,
              logo_url
            ),
            league:leagues(
              league_id,
              name,
              logo_url
            )
          )
        `)
        .or(`prob_home.gte.${minConfidence},prob_draw.gte.${minConfidence},prob_away.gte.${minConfidence}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.warn('Supabase error, using mock data:', error.message);
        return mockPredictions.filter(p =>
          Math.max(p.prob_home || 0, p.prob_draw || 0, p.prob_away || 0) >= minConfidence
        ).slice(0, limit);
      }

      return data || [];
    } catch (error) {
      console.warn('Service error, using mock data:', error);
      return mockPredictions.filter(p =>
        Math.max(p.prob_home || 0, p.prob_draw || 0, p.prob_away || 0) >= minConfidence
      ).slice(0, limit);
    }
  }

  /**
   * Get predictions for today's fixtures
   */
  static async getTodayPredictions(): Promise<FixturePrediction[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const { data, error } = await supabase
      .from('fixture_predictions')
      .select(`
        *,
        fixture:fixtures(
          fixture_id,
          date_utc,
          status,
          home_team:teams!fixtures_home_team_id_fkey(
            team_id,
            name,
            logo_url
          ),
          away_team:teams!fixtures_away_team_id_fkey(
            team_id,
            name,
            logo_url
          ),
          league:leagues(
            league_id,
            name,
            logo_url
          )
        )
      `)
      .gte('fixture.date_utc', startOfDay.toISOString())
      .lt('fixture.date_utc', endOfDay.toISOString())
      .order('fixture.date_utc', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch today's predictions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get predictions by league
   */
  static async getPredictionsByLeague(
    leagueId: number,
    seasonYear?: number,
    limit: number = 20
  ): Promise<FixturePrediction[]> {
    let query = supabase
      .from('fixture_predictions')
      .select(`
        *,
        fixture:fixtures(
          fixture_id,
          date_utc,
          status,
          league_id,
          season_year,
          home_team:teams!fixtures_home_team_id_fkey(
            team_id,
            name,
            logo_url
          ),
          away_team:teams!fixtures_away_team_id_fkey(
            team_id,
            name,
            logo_url
          ),
          league:leagues(
            league_id,
            name,
            logo_url
          )
        )
      `)
      .eq('fixture.league_id', leagueId);

    if (seasonYear) {
      query = query.eq('fixture.season_year', seasonYear);
    }

    query = query
      .order('fixture.date_utc', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch predictions by league: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get prediction accuracy statistics
   */
  static async getPredictionAccuracy(
    modelVersion?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<{
    total_predictions: number;
    correct_predictions: number;
    accuracy_percentage: number;
    by_outcome: {
      home_wins: { predicted: number; correct: number };
      draws: { predicted: number; correct: number };
      away_wins: { predicted: number; correct: number };
    };
  }> {
    // This would require a more complex query or stored procedure
    // For now, we'll return a simplified version
    let query = supabase
      .from('fixture_predictions')
      .select(`
        *,
        fixture:fixtures(
          fixture_id,
          status,
          home_goals,
          away_goals
        )
      `)
      .eq('fixture.status', 'FT');

    if (modelVersion) {
      query = query.eq('model_version', modelVersion);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch prediction accuracy: ${error.message}`);
    }

    const predictions = data || [];
    let correctPredictions = 0;
    const byOutcome = {
      home_wins: { predicted: 0, correct: 0 },
      draws: { predicted: 0, correct: 0 },
      away_wins: { predicted: 0, correct: 0 },
    };

    predictions.forEach(prediction => {
      const fixture = prediction.fixture;
      if (!fixture || fixture.home_goals === null || fixture.away_goals === null) {
        return;
      }

      // Determine actual outcome
      let actualOutcome: 'home' | 'draw' | 'away';
      if (fixture.home_goals > fixture.away_goals) {
        actualOutcome = 'home';
      } else if (fixture.home_goals < fixture.away_goals) {
        actualOutcome = 'away';
      } else {
        actualOutcome = 'draw';
      }

      // Determine predicted outcome (highest probability)
      let predictedOutcome: 'home' | 'draw' | 'away';
      const probHome = prediction.prob_home || 0;
      const probDraw = prediction.prob_draw || 0;
      const probAway = prediction.prob_away || 0;

      if (probHome >= probDraw && probHome >= probAway) {
        predictedOutcome = 'home';
        byOutcome.home_wins.predicted++;
      } else if (probDraw >= probHome && probDraw >= probAway) {
        predictedOutcome = 'draw';
        byOutcome.draws.predicted++;
      } else {
        predictedOutcome = 'away';
        byOutcome.away_wins.predicted++;
      }

      // Check if prediction was correct
      if (predictedOutcome === actualOutcome) {
        correctPredictions++;
        if (actualOutcome === 'home') {
          byOutcome.home_wins.correct++;
        } else if (actualOutcome === 'draw') {
          byOutcome.draws.correct++;
        } else {
          byOutcome.away_wins.correct++;
        }
      }
    });

    return {
      total_predictions: predictions.length,
      correct_predictions: correctPredictions,
      accuracy_percentage: predictions.length > 0 ? (correctPredictions / predictions.length) * 100 : 0,
      by_outcome: byOutcome,
    };
  }

  /**
   * Get model performance comparison
   */
  static async getModelComparison(): Promise<{
    model_version: string;
    total_predictions: number;
    accuracy: number;
    last_updated: string;
  }[]> {
    // This would typically be a materialized view or computed in the backend
    const { data, error } = await supabase
      .from('fixture_predictions')
      .select('model_version, created_at')
      .not('model_version', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch model comparison: ${error.message}`);
    }

    // Group by model version and calculate basic stats
    const modelStats = (data || []).reduce((acc: any, prediction) => {
      const version = prediction.model_version || 'unknown';
      if (!acc[version]) {
        acc[version] = {
          model_version: version,
          total_predictions: 0,
          accuracy: 0, // Would need actual calculation
          last_updated: prediction.created_at,
        };
      }
      acc[version].total_predictions++;
      if (prediction.created_at > acc[version].last_updated) {
        acc[version].last_updated = prediction.created_at;
      }
      return acc;
    }, {});

    return Object.values(modelStats);
  }
}
