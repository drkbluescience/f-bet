import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { 
  Card, 
  Button, 
  ActivityIndicator, 
  Searchbar, 
  DataTable,
  Chip,
  FAB,
  Modal,
  Portal,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants';
import { supabase } from '@/services/supabaseClient';

interface TableInfo {
  table_name: string;
  row_count: number;
  size_pretty: string;
  last_updated?: string;
}

interface TableManagerScreenProps {
  navigation: any;
}

export const TableManagerScreen: React.FC<TableManagerScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDataModal, setShowDataModal] = useState(false);
  const [loadingTableData, setLoadingTableData] = useState(false);

  // Veritabanı tablolarının listesi (supabase-schema.sql'e göre)
  const DATABASE_TABLES = [
    'countries', 'leagues', 'seasons', 'venues', 'teams', 'players',
    'team_squads', 'fixtures', 'fixture_events', 'fixture_lineups',
    'fixture_lineup_players', 'fixture_statistics', 'league_standings',
    'team_statistics', 'player_statistics', 'bookmakers', 'odds',
    'predictions', 'prediction_comparison', 'transfers', 'injuries',
    'coaches', 'team_coaches', 'data_sync_logs'
  ];

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      const tableInfos: TableInfo[] = [];

      for (const tableName of DATABASE_TABLES) {
        try {
          // Tablo var mı kontrol et
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (!error) {
            tableInfos.push({
              table_name: tableName,
              row_count: count || 0,
              size_pretty: 'N/A', // Supabase'de boyut bilgisi almak zor
            });
          }
        } catch (error) {
          console.log(`Table ${tableName} might not exist:`, error);
          // Tablo yoksa 0 kayıt olarak ekle
          tableInfos.push({
            table_name: tableName,
            row_count: 0,
            size_pretty: 'N/A',
          });
        }
      }

      setTables(tableInfos);
    } catch (error) {
      console.error('Error loading tables:', error);
      Alert.alert('Hata', 'Tablolar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTables();
    setRefreshing(false);
  };

  const loadTableData = async (tableName: string) => {
    try {
      setLoadingTableData(true);
      setSelectedTable(tableName);

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(20); // İlk 20 kayıt

      if (error) {
        console.error(`Error loading ${tableName} data:`, error);
        Alert.alert('Hata', `${tableName} tablosu verileri yüklenirken hata oluştu: ${error.message}`);
        setTableData([]);
      } else {
        setTableData(data || []);
        setShowDataModal(true);
      }
    } catch (error) {
      console.error('Error loading table data:', error);
      Alert.alert('Hata', `${tableName} tablosu verileri yüklenirken hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      setTableData([]);
    } finally {
      setLoadingTableData(false);
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'countries': return 'flag';
      case 'leagues': return 'trophy';
      case 'seasons': return 'calendar';
      case 'venues': return 'location';
      case 'teams': return 'people';
      case 'players': return 'person';
      case 'team_squads': return 'people-circle';
      case 'fixtures': return 'football';
      case 'fixture_events': return 'flash';
      case 'fixture_lineups': return 'list';
      case 'fixture_lineup_players': return 'person-add';
      case 'fixture_statistics': return 'bar-chart';
      case 'league_standings': return 'podium';
      case 'team_statistics': return 'stats-chart';
      case 'player_statistics': return 'analytics';
      case 'bookmakers': return 'business';
      case 'odds': return 'trending-up';
      case 'predictions': return 'bulb';
      case 'prediction_comparison': return 'git-compare';
      case 'transfers': return 'swap-horizontal';
      case 'injuries': return 'medical';
      case 'coaches': return 'person-circle';
      case 'team_coaches': return 'school';
      case 'data_sync_logs': return 'sync';
      default: return 'server';
    }
  };

  const getTableColor = (rowCount: number) => {
    if (rowCount === 0) return COLORS.textSecondary;
    if (rowCount < 100) return COLORS.warning;
    if (rowCount < 1000) return COLORS.accent;
    return COLORS.success;
  };

  const filteredTables = tables.filter(table =>
    table.table_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTableCard = ({ item }: { item: TableInfo }) => (
    <Card style={styles.tableCard} onPress={() => loadTableData(item.table_name)}>
      <Card.Content>
        <View style={styles.tableHeader}>
          <View style={styles.tableInfo}>
            <Ionicons 
              name={getTableIcon(item.table_name)} 
              size={24} 
              color={getTableColor(item.row_count)} 
            />
            <View style={styles.tableDetails}>
              <Text style={styles.tableName}>{item.table_name}</Text>
              <Text style={styles.tableSize}>{item.size_pretty}</Text>
            </View>
          </View>
          <Chip 
            mode="outlined"
            style={[styles.countChip, { borderColor: getTableColor(item.row_count) }]}
            textStyle={{ color: getTableColor(item.row_count) }}
          >
            {item.row_count.toLocaleString()}
          </Chip>
        </View>
      </Card.Content>
    </Card>
  );

  const renderDataModal = () => {
    if (!selectedTable || tableData.length === 0) return null;

    const columns = Object.keys(tableData[0] || {});
    
    return (
      <Portal>
        <Modal
          visible={showDataModal}
          onDismiss={() => setShowDataModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedTable} Verileri</Text>
            <Button onPress={() => setShowDataModal(false)}>Kapat</Button>
          </View>
          
          <ScrollView horizontal>
            <DataTable>
              <DataTable.Header>
                {columns.slice(0, 5).map((column) => (
                  <DataTable.Title key={column} style={styles.dataTableTitle}>
                    {column}
                  </DataTable.Title>
                ))}
              </DataTable.Header>
              
              {tableData.slice(0, 20).map((row, index) => (
                <DataTable.Row key={index}>
                  {columns.slice(0, 5).map((column) => (
                    <DataTable.Cell key={column} style={styles.dataTableCell}>
                      <Text style={styles.cellText} numberOfLines={1}>
                        {String(row[column] || '-')}
                      </Text>
                    </DataTable.Cell>
                  ))}
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>
          
          <Text style={styles.modalFooter}>
            İlk 20 kayıt gösteriliyor (Toplam: {tableData.length})
          </Text>
        </Modal>
      </Portal>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Tablolar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Tablo ara..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            Toplam {tables.length} tablo • {tables.reduce((sum, t) => sum + t.row_count, 0).toLocaleString()} kayıt
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredTables}
        renderItem={renderTableCard}
        keyExtractor={(item) => item.table_name}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
      />

      {renderDataModal()}

      {loadingTableData && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
        </View>
      )}

      <FAB
        style={styles.fab}
        icon="refresh"
        onPress={onRefresh}
        color={COLORS.surface}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    backgroundColor: COLORS.background,
    elevation: 0,
  },
  statsRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContainer: {
    padding: 16,
  },
  tableCard: {
    marginBottom: 12,
    backgroundColor: COLORS.surface,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tableDetails: {
    marginLeft: 12,
    flex: 1,
  },
  tableName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  tableSize: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  countChip: {
    height: 28,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  dataTableTitle: {
    minWidth: 100,
  },
  dataTableCell: {
    minWidth: 100,
  },
  cellText: {
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  modalFooter: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
  },
});
