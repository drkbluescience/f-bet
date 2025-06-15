import { API_CONFIG } from '@/constants';
import { DataTrackingService } from './dataTrackingService';

// API-Football endpoints
const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';

// Rate limiting configuration
const RATE_LIMIT = {
  requestsPerMinute: 100, // Free tier limit
  requestsPerDay: 100, // Free tier limit
};

// Request queue for rate limiting
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestCount = 0;
  private lastResetTime = Date.now();

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      // Reset counter if a minute has passed
      const now = Date.now();
      if (now - this.lastResetTime > 60000) {
        this.requestCount = 0;
        this.lastResetTime = now;
      }

      // Check rate limit
      if (this.requestCount >= RATE_LIMIT.requestsPerMinute) {
        console.log('Rate limit reached, waiting...');
        await new Promise(resolve => setTimeout(resolve, 60000));
        this.requestCount = 0;
        this.lastResetTime = Date.now();
      }

      const request = this.queue.shift();
      if (request) {
        this.requestCount++;
        await request();
      }
    }

    this.processing = false;
  }
}

const requestQueue = new RequestQueue();

// API-Football client
class ApiFootballClient {
  private apiKey: string;
  private baseURL: string;

  constructor() {
    this.apiKey = API_CONFIG.apiFootballKey;
    this.baseURL = API_FOOTBALL_BASE_URL;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.apiKey || this.apiKey === 'your-api-football-key') {
      throw new Error('API-Football key not configured');
    }

    return requestQueue.add(async () => {
      const startTime = Date.now();
      const url = new URL(`${this.baseURL}${endpoint}`);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });

      console.log(`🌐 API-Football request: ${url.pathname}${url.search}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'v3.football.api-sports.io',
        },
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        // Log failed API call
        await DataTrackingService.logDataSync({
          table_name: `api_${endpoint.replace('/', '_')}`,
          sync_date: new Date().toISOString().split('T')[0],
          records_added: 0,
          records_updated: 0,
          api_calls_used: 1,
          sync_duration_ms: duration,
          status: 'error',
          error_message: `API request failed: ${response.status} ${response.statusText}`,
        });
        throw new Error(`API-Football request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        // Log API error
        await DataTrackingService.logDataSync({
          table_name: `api_${endpoint.replace('/', '_')}`,
          sync_date: new Date().toISOString().split('T')[0],
          records_added: 0,
          records_updated: 0,
          api_calls_used: 1,
          sync_duration_ms: duration,
          status: 'error',
          error_message: `API-Football error: ${data.errors.join(', ')}`,
        });
        throw new Error(`API-Football error: ${data.errors.join(', ')}`);
      }

      // Log successful API call
      const recordCount = data.response ? (Array.isArray(data.response) ? data.response.length : 1) : 0;
      await DataTrackingService.logDataSync({
        table_name: `api_${endpoint.replace('/', '_')}`,
        sync_date: new Date().toISOString().split('T')[0],
        records_added: recordCount,
        records_updated: 0,
        api_calls_used: 1,
        sync_duration_ms: duration,
        status: 'success',
      });

      return data;
    });
  }

  // Countries
  async getCountries(): Promise<any> {
    return this.makeRequest('/countries');
  }

  // Leagues
  async getLeagues(params: { country?: string; season?: number } = {}): Promise<any> {
    return this.makeRequest('/leagues', params);
  }

  // Teams
  async getTeams(params: { league?: number; season?: number; country?: string } = {}): Promise<any> {
    return this.makeRequest('/teams', params);
  }

  async getTeamById(teamId: number): Promise<any> {
    return this.makeRequest('/teams', { id: teamId });
  }

  async getTeamStatistics(params: { team: number; league: number; season: number }): Promise<any> {
    return this.makeRequest('/teams/statistics', params);
  }

  // Fixtures
  async getFixtures(params: {
    league?: number;
    season?: number;
    team?: number;
    date?: string;
    from?: string;
    to?: string;
    status?: string;
    live?: string;
  } = {}): Promise<any> {
    return this.makeRequest('/fixtures', params);
  }

  async getFixtureById(fixtureId: number): Promise<any> {
    return this.makeRequest('/fixtures', { id: fixtureId });
  }

  async getFixtureEvents(fixtureId: number): Promise<any> {
    return this.makeRequest('/fixtures/events', { fixture: fixtureId });
  }

  async getFixtureLineups(fixtureId: number): Promise<any> {
    return this.makeRequest('/fixtures/lineups', { fixture: fixtureId });
  }

  async getFixtureStatistics(fixtureId: number): Promise<any> {
    return this.makeRequest('/fixtures/statistics', { fixture: fixtureId });
  }

  async getFixtureHeadToHead(params: { h2h: string }): Promise<any> {
    return this.makeRequest('/fixtures/headtohead', params);
  }

  // Live fixtures
  async getLiveFixtures(): Promise<any> {
    return this.makeRequest('/fixtures', { live: 'all' });
  }

  // Players
  async getPlayers(params: { team?: number; league?: number; season?: number; search?: string } = {}): Promise<any> {
    return this.makeRequest('/players', params);
  }

  async getPlayerSeasons(playerId: number): Promise<any> {
    return this.makeRequest('/players/seasons', { player: playerId });
  }

  // Odds
  async getOdds(params: { fixture?: number; league?: number; season?: number; bet?: number } = {}): Promise<any> {
    return this.makeRequest('/odds', params);
  }

  async getOddsMapping(): Promise<any> {
    return this.makeRequest('/odds/mapping');
  }

  async getBookmakers(): Promise<any> {
    return this.makeRequest('/odds/bookmakers');
  }

  async getBets(): Promise<any> {
    return this.makeRequest('/odds/bets');
  }

  // Predictions
  async getPredictions(fixtureId: number): Promise<any> {
    return this.makeRequest('/predictions', { fixture: fixtureId });
  }

  // Standings
  async getStandings(params: { league: number; season: number; team?: number }): Promise<any> {
    return this.makeRequest('/standings', params);
  }

  // Venues
  async getVenues(params: { country?: string; city?: string; search?: string } = {}): Promise<any> {
    return this.makeRequest('/venues', params);
  }

  // Injuries
  async getInjuries(params: { league?: number; season?: number; team?: number; player?: number } = {}): Promise<any> {
    return this.makeRequest('/injuries', params);
  }

  // Transfers
  async getTransfers(params: { player?: number; team?: number } = {}): Promise<any> {
    return this.makeRequest('/transfers', params);
  }

  // Sidelined
  async getSidelined(params: { player?: number; coach?: number } = {}): Promise<any> {
    return this.makeRequest('/sidelined', params);
  }

  // Coaches
  async getCoaches(params: { team?: number; search?: string } = {}): Promise<any> {
    return this.makeRequest('/coachs', params);
  }

  // API Status
  async getStatus(): Promise<any> {
    return this.makeRequest('/status');
  }
}

// Export singleton instance
export const apiFootballClient = new ApiFootballClient();

// Export service functions
export class ApiFootballService {
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiFootballClient.getCountries();
      return { 
        success: true, 
        message: `API-Football connection successful. ${response.results} countries available.` 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `API-Football connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Wrapper methods for common operations
  static async fetchCountries() {
    return apiFootballClient.getCountries();
  }

  static async fetchLeagues(country?: string, season?: number) {
    return apiFootballClient.getLeagues({ country, season });
  }

  static async fetchTeams(league?: number, season?: number) {
    return apiFootballClient.getTeams({ league, season });
  }

  static async fetchFixtures(params: {
    league?: number;
    season?: number;
    team?: number;
    date?: string;
    from?: string;
    to?: string;
  } = {}) {
    return apiFootballClient.getFixtures(params);
  }

  static async fetchLiveFixtures() {
    return apiFootballClient.getLiveFixtures();
  }

  static async fetchTodayFixtures() {
    const today = new Date().toISOString().split('T')[0];
    return apiFootballClient.getFixtures({ date: today });
  }

  static async getAPIStatus() {
    return apiFootballClient.getStatus();
  }
}

export default ApiFootballService;
