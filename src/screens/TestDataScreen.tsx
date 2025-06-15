import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '@/services/supabaseClient';

interface TableData {
  name: string;
  count: number;
  sample?: any;
  error?: string;
}

export const TestDataScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [sampleData, setSampleData] = useState<any[]>([]);

  const tables = [
    'countries',
    'leagues',
    'venues',
    'teams',
    'fixtures',
    'league_standings',
    'predictions'
  ];

  const checkAllTables = async () => {
    setLoading(true);
    const results: TableData[] = [];

    for (const tableName of tables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .limit(1);

        if (error) {
          results.push({
            name: tableName,
            count: 0,
            error: error.message
          });
        } else {
          results.push({
            name: tableName,
            count: count || 0,
            sample: data?.[0]
          });
        }
      } catch (err) {
        results.push({
          name: tableName,
          count: 0,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    setTableData(results);
    setLoading(false);
  };

  const viewTableData = async (tableName: string) => {
    try {
      setSelectedTable(tableName);
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(10);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setSampleData(data || []);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('count(*)')
        .single();

      if (error) {
        Alert.alert('Connection Error', error.message);
      } else {
        Alert.alert('Success', 'Supabase connection working!');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Connection failed');
    }
  };

  useEffect(() => {
    checkAllTables();
  }, []);

  const renderTableRow = (table: TableData) => (
    <TouchableOpacity
      key={table.name}
      style={[
        styles.tableRow,
        table.error ? styles.errorRow : table.count > 0 ? styles.successRow : styles.emptyRow
      ]}
      onPress={() => viewTableData(table.name)}
    >
      <Text style={styles.tableName}>{table.name}</Text>
      <Text style={styles.tableCount}>
        {table.error ? 'Error' : `${table.count} records`}
      </Text>
      {table.error && (
        <Text style={styles.errorText}>{table.error}</Text>
      )}
    </TouchableOpacity>
  );

  const renderSampleData = () => {
    if (!selectedTable || sampleData.length === 0) return null;

    return (
      <View style={styles.sampleDataContainer}>
        <Text style={styles.sampleTitle}>Sample data from {selectedTable}:</Text>
        <ScrollView style={styles.sampleScroll}>
          {sampleData.map((item, index) => (
            <View key={index} style={styles.sampleItem}>
              <Text style={styles.sampleIndex}>Record {index + 1}:</Text>
              <Text style={styles.sampleJson}>
                {JSON.stringify(item, null, 2)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>F-Bet Database Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={testSupabaseConnection}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={checkAllTables}>
          <Text style={styles.buttonText}>Refresh Data</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Checking tables...</Text>
        </View>
      ) : (
        <View style={styles.tablesContainer}>
          <Text style={styles.sectionTitle}>Database Tables:</Text>
          {tableData.map(renderTableRow)}
          
          <View style={styles.summary}>
            <Text style={styles.summaryText}>
              Total Records: {tableData.reduce((sum, table) => sum + table.count, 0)}
            </Text>
            <Text style={styles.summaryText}>
              Tables with Data: {tableData.filter(table => table.count > 0).length}/{tableData.length}
            </Text>
          </View>
        </View>
      )}

      {renderSampleData()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  tablesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  tableRow: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  successRow: {
    borderLeftColor: '#4CAF50',
  },
  emptyRow: {
    borderLeftColor: '#FFC107',
  },
  errorRow: {
    borderLeftColor: '#F44336',
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tableCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  summary: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  summaryText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  sampleDataContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  sampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sampleScroll: {
    maxHeight: 300,
  },
  sampleItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
  },
  sampleIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#007AFF',
  },
  sampleJson: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
});
