# F-Bet: Football Betting Platform

F-Bet is a comprehensive football betting platform featuring a full‑stack pipeline for API‑Football data ingestion, real‑time processing, machine learning predictions, and a cross‑platform mobile application.

## 🔍 Project Overview

**Data Source**: API‑Football v3 (fixtures, odds, players, events, etc.)

**Storage & Realtime**: Supabase (PostgreSQL + Storage buckets + Realtime)

**ETL & Scheduling**: Python collectors + APScheduler/cron jobs

**Feature Store & Models**: Feast offline + CatBoost/LightGBM in MLflow

**Serving & Bets**: FastAPI prediction + Celery bet executor

**Front‑end**: React Native + Expo (iOS, Android, Web)

**Monitoring**: Prometheus + Grafana dashboards

## 🚀 Mobile App Features

- **Real-time Match Data**: Live scores, fixtures, and match events
- **AI Predictions**: Machine learning powered match predictions with confidence scores
- **Betting Odds**: Real-time odds from multiple bookmakers with comparison tools
- **Team & Player Stats**: Comprehensive statistics and performance metrics
- **Cross-platform**: Works on iOS, Android, and Web
- **Dark Theme**: Modern dark UI optimized for mobile viewing
- **Real-time Updates**: Live data synchronization using Supabase realtime

## 📱 App Screens

- **Home**: Dashboard with live matches, today's fixtures, and AI predictions
- **Fixture Detail**: Detailed match information, statistics, and events
- **Odds**: Betting odds comparison across bookmakers
- **Predictions**: AI-powered match predictions and model performance
- **Teams**: Team profiles, statistics, and recent form
- **Players**: Player profiles and performance metrics
- **Leagues**: League standings and information

## 🛠 Tech Stack

- **React Native** with **Expo** for cross-platform development
- **TypeScript** for type safety
- **React Navigation** for navigation
- **React Query** for data fetching and caching
- **Supabase** for backend and real-time data
- **React Native Paper** for UI components
- **Expo Vector Icons** for iconography

🗄️ Database Schema
-- 0. Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. Meta (reference) tables
create table public.countries (
  country_id    int        primary key,
  name          text       not null,
  code          text       not null,
  flag_url      text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table public.seasons (
  season_year   int        primary key,
  start_date    date,
  end_date      date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table public.leagues (
  league_id     int        primary key,
  name          text       not null,
  country_id    int        not null references public.countries(country_id),
  season_year   int        not null references public.seasons(season_year),
  type          text,
  logo_url      text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(league_id, season_year)
);

-- 2. Teams & Players
create table public.teams (
  team_id       int        primary key,
  name          text       not null,
  country_id    int        references public.countries(country_id),
  founded_year  int,
  venue_id      int,
  logo_url      text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table public.team_season_stats (
  league_id     int        not null references public.leagues(league_id),
  season_year   int        not null references public.seasons(season_year),
  team_id       int        not null references public.teams(team_id),
  matches_played int,
  wins          int,
  draws         int,
  losses        int,
  goals_for     int,
  goals_against int,
  form          text,
  updated_at    timestamptz default now(),
  primary key(league_id, season_year, team_id)
);

create table public.coaches (
  coach_id      int        primary key,
  team_id       int        references public.teams(team_id),
  name          text,
  nationality   text,
  photo_url     text,
  start_date    date,
  end_date      date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table public.players (
  player_id     int        primary key,
  name          text       not null,
  team_id       int        references public.teams(team_id),
  position      text,
  nationality   text,
  birth_date    date,
  height_cm     int,
  weight_kg     int,
  photo_url     text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table public.player_season_stats (
  player_id     int        not null references public.players(player_id),
  league_id     int        not null references public.leagues(league_id),
  season_year   int        not null references public.seasons(season_year),
  matches        int,
  goals          int,
  assists        int,
  yellow_cards   int,
  red_cards      int,
  minutes         int,
  updated_at    timestamptz default now(),
  primary key(player_id, league_id, season_year)
);

create table public.transfers (
  transfer_id   uuid       primary key default uuid_generate_v4(),
  player_id     int        not null references public.players(player_id),
  date          date,
  type          text,
  fee           numeric,
  from_team     int        references public.teams(team_id),
  to_team       int        references public.teams(team_id),
  created_at    timestamptz default now()
);

-- 3. Fixtures & Details
create table public.fixtures (
  fixture_id     int       primary key,
  league_id      int       not null references public.leagues(league_id),
  season_year    int       not null references public.seasons(season_year),
  date_utc       timestamptz,
  status         text,
  home_team_id   int       not null references public.teams(team_id),
  away_team_id   int       not null references public.teams(team_id),
  venue_id       int       references public.teams(venue_id),
  referee        text,
  home_goals     int,
  away_goals     int,
  updated_at     timestamptz default now()
);

create table public.fixture_team_stats (
  fixture_id     int       not null references public.fixtures(fixture_id),
  team_id        int       not null references public.teams(team_id),
  possession     int,
  shots          int,
  shots_on_goal  int,
  corners        int,
  fouls          int,
  yellow_cards   int,
  red_cards      int,
  updated_at     timestamptz default now(),
  primary key(fixture_id, team_id)
);

create table public.fixture_events (
  event_id       uuid      primary key default uuid_generate_v4(),
  fixture_id     int       not null references public.fixtures(fixture_id),
  minute         int,
  team_id        int       references public.teams(team_id),
  player_id      int       references public.players(player_id),
  type           text,
  detail         text,
  created_at     timestamptz default now()
);

create table public.fixture_lineups (
  lineup_id      uuid      primary key default uuid_generate_v4(),
  fixture_id     int       not null references public.fixtures(fixture_id),
  team_id        int       not null references public.teams(team_id),
  formation      text,
  captain        int       references public.players(player_id),
  lineup_json    jsonb,
  created_at     timestamptz default now()
);

-- 4. Odds & Bets
create table public.bookmakers (
  bookmaker_id   int        primary key,
  name           text       not null,
  country        text,
  updated_at     timestamptz default now()
);

create table public.bet_markets (
  bet_id         int        primary key,
  name           text,
  updated_at     timestamptz default now()
);

create table public.odds_snapshots (
  snapshot_id     uuid      primary key default uuid_generate_v4(),
  fixture_id      int       not null references public.fixtures(fixture_id),
  bookmaker_id    int       not null references public.bookmakers(bookmaker_id),
  bet_id          int       not null references public.bet_markets(bet_id),
  odds            numeric,
  overround        numeric,
  live             boolean  default false,
  recorded_at     timestamptz default now()
);

-- 5. Sidelined & Injuries
create table public.venues (
  venue_id       int        primary key,
  name           text,
  city           text,
  country        text,
  capacity       int,
  surface        text,
  latitude       numeric,
  longitude      numeric,
  updated_at     timestamptz default now()
);

create table public.sidelined_players (
  id              uuid      primary key default uuid_generate_v4(),
  fixture_id      int       references public.fixtures(fixture_id),
  player_id       int       references public.players(player_id),
  team_id         int       references public.teams(team_id),
  reason          text,
  date            date,
  created_at      timestamptz default now()
);

create table public.injury_history (
  injury_id       uuid      primary key default uuid_generate_v4(),
  player_id       int       not null references public.players(player_id),
  start_date      date,
  return_date     date,
  type            text,
  source          text,
  created_at      timestamptz default now()
);

-- 6. H2H & Predictions
create table public.h2h_history (
  id              uuid      primary key default uuid_generate_v4(),
  team1_id        int       not null references public.teams(team_id),
  team2_id        int       not null references public.teams(team_id),
  last_fixtures   jsonb,
  updated_at      timestamptz default now()
);

create table public.fixture_predictions (
  fixture_id      int       primary key references public.fixtures(fixture_id),
  prob_home       numeric,
  prob_draw       numeric,
  prob_away       numeric,
  model_version   text,
  created_at      timestamptz default now()
);



## � Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/eas-cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### 1. Clone the repository
```bash
git clone <repository-url>
cd f-bet
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Copy the example environment file and configure your credentials:
```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_API_FOOTBALL_KEY=your-api-football-key
EXPO_PUBLIC_APP_ENV=development
```

**Important**:
- Get Supabase credentials from your [Supabase Dashboard](https://supabase.com/dashboard)
- Get API-Football key from [API-Football](https://www.api-football.com/)
- The app will work with mock data if credentials are not configured

### 4. Start the development server
```bash
npm start
```

## 🏃‍♂️ Running the App

### Development
```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web
```

### Building for Production
```bash
# Build for Android
npm run build:android

# Build for iOS
npm run build:ios

# Build for Web
npm run build:web
```

## 📁 Project Structure

```
f-bet/
├── App.tsx                 # Main app entry point
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── babel.config.js        # Babel configuration
├── .env                   # Environment variables (create this file)
├── assets/                # Static assets (images, fonts)
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── FixtureCard.tsx
│   ├── screens/           # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── FixtureDetailScreen.tsx
│   │   ├── OddsScreen.tsx
│   │   ├── PredictionsScreen.tsx
│   │   ├── TeamsScreen.tsx
│   │   ├── PlayersScreen.tsx
│   │   └── LeaguesScreen.tsx
│   ├── navigation/        # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── services/          # API services
│   │   ├── supabaseClient.ts
│   │   ├── fixturesService.ts
│   │   ├── teamsService.ts
│   │   ├── oddsService.ts
│   │   └── predictionsService.ts
│   ├── hooks/             # Custom React hooks
│   │   └── index.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/             # Utility functions
│   │   └── index.ts
│   └── constants/         # App constants and configuration
│       └── index.ts
├── scripts/               # init & migration scripts
├── collectors/            # Python modules to pull API-Football
├── spark_jobs/            # bronze_loader.py, silver_cleanser.py
├── dbt_project/           # SQL models (staging, marts, features)
├── feast_repo/            # Feast feature definitions
├── ml/                    # train.py, backtest.py, models/
├── api/                   # FastAPI & Celery bet_executor
├── monitoring/            # Prometheus, Grafana provisioning
├── lake/                  # bind‑mount raw/bronze/silver
├── data/                  # sample JSON/Parquet
├── logs/                  # airflow, collectors, spark logs
└── docs/                  # markdown docs & ASCII diagrams
```

## 🎨 Design System

The app uses a consistent design system with:

- **Colors**: Dark theme with accent colors for different states
- **Typography**: Consistent font sizes and weights
- **Spacing**: Standardized spacing scale
- **Components**: Reusable UI components with consistent styling

## 🔧 Configuration

### Environment Variables

- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `EXPO_PUBLIC_API_FOOTBALL_KEY`: API-Football API key
- `EXPO_PUBLIC_APP_ENV`: Environment (development/production)

### Supabase Setup

1. Create a Supabase project
2. Set up the database schema (see Database Schema section above)
3. Configure Row Level Security (RLS) policies
4. Add your Supabase credentials to `.env`

## 📊 Data Flow

1. **Services** handle API calls to Supabase
2. **React Query** manages data fetching, caching, and synchronization
3. **Custom Hooks** provide data to components
4. **Real-time subscriptions** keep data updated automatically

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 🚀 Deployment

### Expo Application Services (EAS)

1. Install EAS CLI: `npm install -g @expo/eas-cli`
2. Configure EAS: `eas build:configure`
3. Build for production: `eas build --platform all`
4. Submit to app stores: `eas submit`

### Web Deployment

The web version can be deployed to any static hosting service:

```bash
npm run build:web
# Deploy the web-build folder to your hosting service
```

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Use TypeScript for all new code
3. Add proper error handling and loading states
4. Test on multiple platforms (iOS, Android, Web)
5. Update documentation for new features

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the project documentation
2. Review the Supabase and Expo documentation
3. Create an issue in the project repository