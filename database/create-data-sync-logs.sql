-- Create data_sync_logs table for tracking data synchronization operations
-- This table is used by the DataTrackingService to log all data sync operations

CREATE TABLE IF NOT EXISTS data_sync_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    sync_date DATE NOT NULL,
    records_added INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    api_calls_used INTEGER DEFAULT 0,
    sync_duration_ms INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_table_date ON data_sync_logs(table_name, sync_date);
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_date ON data_sync_logs(sync_date);
CREATE INDEX IF NOT EXISTS idx_data_sync_logs_created_at ON data_sync_logs(created_at);

-- Insert some sample data for testing (optional)
INSERT INTO data_sync_logs (table_name, sync_date, records_added, records_updated, api_calls_used, sync_duration_ms, status) VALUES
('countries', CURRENT_DATE, 50, 0, 1, 1200, 'success'),
('leagues', CURRENT_DATE, 25, 5, 2, 2500, 'success'),
('teams', CURRENT_DATE, 100, 10, 5, 4500, 'success'),
('fixtures', CURRENT_DATE, 200, 50, 10, 8500, 'success'),
('players', CURRENT_DATE, 500, 25, 15, 12000, 'success'),
('odds', CURRENT_DATE, 1000, 100, 20, 15000, 'success'),
('predictions', CURRENT_DATE, 50, 10, 5, 3000, 'success'),
('countries', CURRENT_DATE - 1, 45, 2, 1, 1100, 'success'),
('leagues', CURRENT_DATE - 1, 20, 3, 2, 2200, 'success'),
('teams', CURRENT_DATE - 1, 95, 8, 5, 4200, 'success'),
('fixtures', CURRENT_DATE - 1, 180, 45, 9, 8000, 'success'),
('players', CURRENT_DATE - 1, 480, 20, 14, 11500, 'success'),
('odds', CURRENT_DATE - 1, 950, 95, 19, 14500, 'success'),
('predictions', CURRENT_DATE - 1, 45, 8, 4, 2800, 'success'),
('bookmakers', CURRENT_DATE, 15, 0, 1, 800, 'success'),
('venues', CURRENT_DATE, 30, 2, 2, 1500, 'success');

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON data_sync_logs TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE data_sync_logs_id_seq TO authenticated;
