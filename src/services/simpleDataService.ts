import { supabase } from './supabaseClient';

/**
 * Basit veri çekme servisi - JOIN kullanmadan
 * Sadece temel tabloları sorgular
 */
export class SimpleDataService {

  /**
   * Supabase bağlantısını test et
   */
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('count(*)', { count: 'exact', head: true });

      if (error) {
        console.error('Connection test error:', error);
        return { success: false, message: error.message, data: null };
      }

      return {
        success: true,
        message: 'Bağlantı başarılı',
        data: { count: data || 0 }
      };
    } catch (error) {
      console.error('Connection test exception:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Bilinmeyen hata',
        data: null
      };
    }
  }

  /**
   * Mock client kullanılıp kullanılmadığını kontrol et
   */
  static async checkIfMockClient() {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('count(*)', { count: 'exact', head: true });

      // Mock client'ta error mesajı "Using mock data" ile başlar
      if (error && error.message && error.message.includes('Using mock data')) {
        return true;
      }

      return false;
    } catch (error) {
      // Hata varsa muhtemelen mock client
      return true;
    }
  }
  
  /**
   * Ülkeleri çek
   */
  static async getCountries() {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Countries fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Countries service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Ligleri çek (basit)
   */
  static async getLeagues() {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Leagues fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Leagues service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Sezonları çek
   */
  static async getSeasons() {
    try {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .order('year', { ascending: false });

      if (error) {
        console.error('Seasons fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Seasons service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Mekanları çek
   */
  static async getVenues() {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Venues fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Venues service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Takımları çek (basit)
   */
  static async getTeams(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Teams fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Teams service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Oyuncuları çek
   */
  static async getPlayers(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Players fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Players service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Takım kadroları çek
   */
  static async getTeamSquads(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('team_squads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Team squads fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Team squads service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Maçları çek (basit)
   */
  static async getFixtures(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('fixtures')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Fixtures fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Fixtures service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Maç olayları çek
   */
  static async getFixtureEvents(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('fixture_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Fixture events fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Fixture events service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Lig sıralaması çek (basit)
   */
  static async getLeagueStandings(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('league_standings')
        .select('*')
        .order('rank', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('League standings fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('League standings service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Takım istatistikleri çek
   */
  static async getTeamStatistics(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('team_statistics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Team statistics fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Team statistics service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Oyuncu istatistikleri çek
   */
  static async getPlayerStatistics(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('player_statistics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Player statistics fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Player statistics service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Bahis şirketleri çek
   */
  static async getBookmakers() {
    try {
      const { data, error } = await supabase
        .from('bookmakers')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Bookmakers fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Bookmakers service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Bahis oranları çek (basit)
   */
  static async getOdds(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('odds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Odds fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Odds service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Tahminler çek (basit)
   */
  static async getPredictions(limit = 50) {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Predictions fetch error:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Predictions service error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Dashboard istatistikleri çek
   */
  static async getDashboardStats(seasonYear?: number) {
    try {
      const stats = {
        countries: 0,
        leagues: 0,
        teams: 0,
        players: 0,
        seasons: 0,
        fixtures: 0,
        venues: 0,
        standings: 0,
        teamStats: 0,
        playerStats: 0
      };

      // Mock client kontrolü
      const isMockClient = await SimpleDataService.checkIfMockClient();
      if (isMockClient) {
        console.log('Using mock client - returning sample data');
        return {
          data: {
            countries: 195,
            leagues: seasonYear ? 25 : 45,
            teams: seasonYear ? 450 : 850,
            players: seasonYear ? 8500 : 12500,
            seasons: 4,
            fixtures: seasonYear ? 1200 : 2500,
            venues: 320,
            standings: seasonYear ? 380 : 0,
            teamStats: seasonYear ? 450 : 0,
            playerStats: seasonYear ? 8500 : 0
          },
          error: null
        };
      }

      // Ülke sayısı
      const { count: countriesCount } = await supabase
        .from('countries')
        .select('*', { count: 'exact', head: true });
      stats.countries = countriesCount || 0;

      // Lig sayısı (sezona göre filtrelenebilir - seasons tablosu üzerinden)
      let leaguesCount = 0;
      try {
        if (seasonYear) {
          // Sezona göre aktif ligleri say
          const { count, error } = await supabase
            .from('seasons')
            .select('league_id', { count: 'exact', head: true })
            .eq('year', seasonYear);

          if (error) {
            console.warn('Leagues count with season filter error:', error);
            // Fallback: tüm ligleri say
            const { count: totalCount } = await supabase
              .from('leagues')
              .select('*', { count: 'exact', head: true });
            leaguesCount = totalCount || 0;
          } else {
            leaguesCount = count || 0;
          }
        } else {
          // Sezon filtresi olmadan tüm ligleri say
          const { count, error } = await supabase
            .from('leagues')
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.warn('Leagues count error:', error);
            leaguesCount = 0;
          } else {
            leaguesCount = count || 0;
          }
        }
      } catch (error) {
        console.error('Leagues count exception:', error);
        leaguesCount = 0;
      }
      stats.leagues = leaguesCount;

      // Takım sayısı (sezona göre filtrelenebilir - team_squads tablosu üzerinden)
      let teamsCount = 0;
      try {
        if (seasonYear) {
          // Sezona göre aktif takımları say
          const { count, error } = await supabase
            .from('team_squads')
            .select('team_id', { count: 'exact', head: true })
            .eq('season_year', seasonYear);

          if (error) {
            console.warn('Teams count with season filter error:', error);
            // Fallback: tüm takımları say
            const { count: totalCount } = await supabase
              .from('teams')
              .select('*', { count: 'exact', head: true });
            teamsCount = totalCount || 0;
          } else {
            // Benzersiz takım sayısını almak için distinct kullan
            const { data: distinctTeams, error: distinctError } = await supabase
              .from('team_squads')
              .select('team_id')
              .eq('season_year', seasonYear);

            if (!distinctError && distinctTeams) {
              const uniqueTeamIds = new Set(distinctTeams.map(item => item.team_id));
              teamsCount = uniqueTeamIds.size;
            } else {
              teamsCount = count || 0;
            }
          }
        } else {
          // Sezon filtresi olmadan tüm takımları say
          const { count, error } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.warn('Teams count error:', error);
            teamsCount = 0;
          } else {
            teamsCount = count || 0;
          }
        }
      } catch (error) {
        console.error('Teams count exception:', error);
        teamsCount = 0;
      }
      stats.teams = teamsCount;

      // Oyuncu sayısı (sezona göre filtrelenebilir - team_squads tablosu üzerinden)
      let playersCount = 0;
      try {
        if (seasonYear) {
          // Sezona göre aktif oyuncuları say
          const { data: distinctPlayers, error } = await supabase
            .from('team_squads')
            .select('player_id')
            .eq('season_year', seasonYear);

          if (error) {
            console.warn('Players count with season filter error:', error);
            // Fallback: tüm oyuncuları say
            const { count: totalCount } = await supabase
              .from('players')
              .select('*', { count: 'exact', head: true });
            playersCount = totalCount || 0;
          } else if (distinctPlayers) {
            // Benzersiz oyuncu sayısını al
            const uniquePlayerIds = new Set(distinctPlayers.map(item => item.player_id));
            playersCount = uniquePlayerIds.size;
          }
        } else {
          // Sezon filtresi olmadan tüm oyuncuları say
          const { count, error } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.warn('Players count error:', error);
            playersCount = 0;
          } else {
            playersCount = count || 0;
          }
        }
      } catch (error) {
        console.error('Players count exception:', error);
        playersCount = 0;
      }
      stats.players = playersCount;

      // Sezon sayısı
      const { count: seasonsCount } = await supabase
        .from('seasons')
        .select('*', { count: 'exact', head: true });
      stats.seasons = seasonsCount || 0;

      // Maç sayısı (sezona göre filtrelenebilir)
      let fixturesCount = 0;
      try {
        if (seasonYear) {
          // Sezon yılına göre filtrele (date alanından yıl çıkararak)
          const startDate = `${seasonYear}-01-01`;
          const endDate = `${seasonYear + 1}-12-31`;

          const { count, error } = await supabase
            .from('fixtures')
            .select('*', { count: 'exact', head: true })
            .gte('date', startDate)
            .lt('date', endDate);

          if (error) {
            console.warn('Fixtures count with season filter error:', error);
            // Fallback: tüm maçları say
            const { count: totalCount } = await supabase
              .from('fixtures')
              .select('*', { count: 'exact', head: true });
            fixturesCount = totalCount || 0;
          } else {
            fixturesCount = count || 0;
          }
        } else {
          // Sezon filtresi olmadan tüm maçları say
          const { count, error } = await supabase
            .from('fixtures')
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.warn('Fixtures count error:', error);
            fixturesCount = 0;
          } else {
            fixturesCount = count || 0;
          }
        }
      } catch (error) {
        console.error('Fixtures count exception:', error);
        fixturesCount = 0;
      }

      stats.fixtures = fixturesCount;

      // Mekan sayısı (sezon bağımsız)
      const { count: venuesCount } = await supabase
        .from('venues')
        .select('*', { count: 'exact', head: true });
      stats.venues = venuesCount || 0;

      // Lig sıralaması sayısı (sezona göre filtrelenebilir)
      let standingsCount = 0;
      try {
        if (seasonYear) {
          const { count, error } = await supabase
            .from('league_standings')
            .select('*', { count: 'exact', head: true })
            .eq('season_year', seasonYear);

          if (error) {
            console.warn('Standings count error:', error);
            standingsCount = 0;
          } else {
            standingsCount = count || 0;
          }
        } else {
          // Sezon filtresi olmadan tüm sıralamaları say
          const { count, error } = await supabase
            .from('league_standings')
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.warn('Standings count error:', error);
            standingsCount = 0;
          } else {
            standingsCount = count || 0;
          }
        }
      } catch (error) {
        console.error('Standings count exception:', error);
        standingsCount = 0;
      }
      stats.standings = standingsCount;

      // Takım istatistikleri sayısı (sezona göre filtrelenebilir)
      let teamStatsCount = 0;
      try {
        if (seasonYear) {
          const { count, error } = await supabase
            .from('team_statistics')
            .select('*', { count: 'exact', head: true })
            .eq('season_year', seasonYear);

          if (error) {
            console.warn('Team stats count error:', error);
            teamStatsCount = 0;
          } else {
            teamStatsCount = count || 0;
          }
        } else {
          // Sezon filtresi olmadan tüm takım istatistiklerini say
          const { count, error } = await supabase
            .from('team_statistics')
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.warn('Team stats count error:', error);
            teamStatsCount = 0;
          } else {
            teamStatsCount = count || 0;
          }
        }
      } catch (error) {
        console.error('Team stats count exception:', error);
        teamStatsCount = 0;
      }
      stats.teamStats = teamStatsCount;

      // Oyuncu istatistikleri sayısı (sezona göre filtrelenebilir)
      let playerStatsCount = 0;
      try {
        if (seasonYear) {
          const { count, error } = await supabase
            .from('player_statistics')
            .select('*', { count: 'exact', head: true })
            .eq('season_year', seasonYear);

          if (error) {
            console.warn('Player stats count error:', error);
            playerStatsCount = 0;
          } else {
            playerStatsCount = count || 0;
          }
        } else {
          // Sezon filtresi olmadan tüm oyuncu istatistiklerini say
          const { count, error } = await supabase
            .from('player_statistics')
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.warn('Player stats count error:', error);
            playerStatsCount = 0;
          } else {
            playerStatsCount = count || 0;
          }
        }
      } catch (error) {
        console.error('Player stats count exception:', error);
        playerStatsCount = 0;
      }
      stats.playerStats = playerStatsCount;

      return { data: stats, error: null };
    } catch (error) {
      console.error('Dashboard stats service error:', error);
      return {
        data: {
          countries: 0,
          leagues: 0,
          teams: 0,
          players: 0,
          seasons: 0,
          fixtures: 0,
          venues: 0,
          standings: 0,
          teamStats: 0,
          playerStats: 0
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mevcut sezonları çek (son 3 + gelecek)
   */
  static async getAvailableSeasons() {
    try {
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .gte('year', currentYear - 2) // Son 3 yıl
        .lte('year', currentYear + 1) // Gelecek yıl dahil
        .order('year', { ascending: false });

      if (error) {
        console.error('Seasons fetch error:', error);
        // Fallback: manuel sezon listesi
        const fallbackSeasons = [
          { id: currentYear + 1, year: currentYear + 1, name: `${currentYear + 1}/${currentYear + 2}` },
          { id: currentYear, year: currentYear, name: `${currentYear}/${currentYear + 1}` },
          { id: currentYear - 1, year: currentYear - 1, name: `${currentYear - 1}/${currentYear}` },
          { id: currentYear - 2, year: currentYear - 2, name: `${currentYear - 2}/${currentYear - 1}` },
        ];
        return { data: fallbackSeasons, error: null };
      }

      // Eğer veri yoksa fallback kullan
      if (!data || data.length === 0) {
        const fallbackSeasons = [
          { id: currentYear + 1, year: currentYear + 1, name: `${currentYear + 1}/${currentYear + 2}` },
          { id: currentYear, year: currentYear, name: `${currentYear}/${currentYear + 1}` },
          { id: currentYear - 1, year: currentYear - 1, name: `${currentYear - 1}/${currentYear}` },
          { id: currentYear - 2, year: currentYear - 2, name: `${currentYear - 2}/${currentYear - 1}` },
        ];
        return { data: fallbackSeasons, error: null };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Available seasons service error:', error);
      const currentYear = new Date().getFullYear();
      const fallbackSeasons = [
        { id: currentYear + 1, year: currentYear + 1, name: `${currentYear + 1}/${currentYear + 2}` },
        { id: currentYear, year: currentYear, name: `${currentYear}/${currentYear + 1}` },
        { id: currentYear - 1, year: currentYear - 1, name: `${currentYear - 1}/${currentYear}` },
        { id: currentYear - 2, year: currentYear - 2, name: `${currentYear - 2}/${currentYear - 1}` },
      ];
      return { data: fallbackSeasons, error: null };
    }
  }
}
