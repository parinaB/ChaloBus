import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Clock, Users, DollarSign, Navigation, Search, Menu } from 'lucide-react-native';
import { useBusData } from '@/hooks/useBusData';
import { router } from 'expo-router';
import { DynamicMap } from '@/components/DynamicMap';
import { LocationSearch } from '@/components/LocationSearch';
import { LocationData, BusLocation, useLocationService } from '@/hooks/useLocationService';

const { width, height } = Dimensions.get('window');

export default function PassengerScreen() {
  const insets = useSafeAreaInsets();
  const [origin, setOrigin] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [route, setRoute] = useState<any>(null);
  const { buses, busStops } = useBusData();
  const { currentLocation, getDirections, calculateDistance } = useLocationService();

  const showMessage = (message: string) => {
    if (!message.trim() || message.length > 200) return;
    const sanitizedMessage = message.trim();
    setModalMessage(sanitizedMessage);
    setShowModal(true);
  };

  useEffect(() => {
    if (currentLocation) {
      setOrigin(currentLocation);
    }
  }, [currentLocation]);

  useEffect(() => {
    // Simulate bus locations with real coordinates
    const mockBusLocations: BusLocation[] = buses.map((bus, index) => ({
      busId: bus.id,
      busNumber: bus.number,
      latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
      longitude: 77.2090 + (Math.random() - 0.5) * 0.1,
      heading: Math.random() * 360,
      speed: 20 + Math.random() * 40,
    }));
    setBusLocations(mockBusLocations);
  }, [buses]);

  useEffect(() => {
    if (origin && destination) {
      loadRoute();
    }
  }, [origin, destination]);

  const loadRoute = async () => {
    if (!origin || !destination) return;
    
    try {
      const routeData = await getDirections(origin, destination);
      setRoute(routeData);
      searchBuses();
    } catch (error) {
      console.log('Failed to load route:', error);
    }
  };

  const searchBuses = () => {
    if (!origin || !destination) {
      showMessage('Please select both origin and destination');
      return;
    }

    // Filter buses based on proximity to origin and destination
    const results = buses.filter(bus => {
      const busLocation = busLocations.find(bl => bl.busId === bus.id);
      if (!busLocation) return false;
      
      const distanceToOrigin = calculateDistance(origin, busLocation);
      const distanceToDestination = calculateDistance(destination, busLocation);
      
      return distanceToOrigin < 5 && distanceToDestination < 10; // Within 5km of origin, 10km of destination
    }).map(bus => {
      const busLocation = busLocations.find(bl => bl.busId === bus.id);
      const distance = busLocation ? calculateDistance(origin, busLocation) : 0;
      return {
        ...bus,
        distance: distance.toFixed(1),
        estimatedTime: Math.round(distance * 3 + Math.random() * 10), // Rough estimate
      };
    });

    setSearchResults(results);
  };

  const handleLocationSelect = (location: LocationData, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setOrigin(location);
    } else {
      setDestination(location);
    }
  };

  const selectBus = (bus: any) => {
    if (!bus?.id || !bus?.number) return;
    
    router.push({
      pathname: '/tracking',
      params: { busId: bus.id, busNumber: bus.number }
    });
  };

  if (showLocationSearch) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LocationSearch
          onLocationSelect={handleLocationSelect}
          currentLocation={origin}
          destination={destination}
          onClose={() => setShowLocationSearch(false)}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <DynamicMap
          currentLocation={origin}
          busLocations={busLocations}
          destination={destination}
          route={route}
          style={styles.map}
          showUserLocation={true}
          followUserLocation={false}
        />
        
        {/* Header Overlay */}
        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.menuButton}>
            <Menu color="#111827" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>BusTracker</Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* Search Bar Overlay */}
        <TouchableOpacity 
          style={styles.searchBarOverlay}
          onPress={() => setShowLocationSearch(true)}
        >
          <Search color="#6B7280" size={20} />
          <View style={styles.searchContent}>
            <Text style={styles.searchFromText}>
              {origin?.address?.split(',')[0] || 'From'}
            </Text>
            <Text style={styles.searchToText}>
              {destination?.address?.split(',')[0] || 'Where to?'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.bottomSheetHandle} />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {origin && destination && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeTitle}>Route Information</Text>
              {route && (
                <View style={styles.routeDetails}>
                  <View style={styles.routeDetailItem}>
                    <Clock color="#6B7280" size={16} />
                    <Text style={styles.routeDetailText}>{route.duration}</Text>
                  </View>
                  <View style={styles.routeDetailItem}>
                    <Navigation color="#6B7280" size={16} />
                    <Text style={styles.routeDetailText}>{route.distance}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {searchResults.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Available Buses</Text>
              {searchResults.map((bus) => (
                <TouchableOpacity
                  key={bus.id}
                  style={styles.busCard}
                  onPress={() => selectBus(bus)}
                >
                  <View style={styles.busHeader}>
                    <Text style={styles.busNumber}>Bus {bus.number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: bus.status === 'active' ? '#059669' : '#9CA3AF' }]}>
                      <Text style={styles.statusText}>{bus.status}</Text>
                    </View>
                  </View>

                  <View style={styles.busDetails}>
                    <View style={styles.detailItem}>
                      <Clock color="#6B7280" size={16} />
                      <Text style={styles.detailText}>{bus.estimatedTime} min</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <DollarSign color="#6B7280" size={16} />
                      <Text style={styles.detailText}>₹{bus.fare}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Users color="#6B7280" size={16} />
                      <Text style={styles.detailText}>{bus.occupancy}% full</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <MapPin color="#6B7280" size={16} />
                      <Text style={styles.detailText}>{bus.distance} km</Text>
                    </View>
                  </View>

                  <Text style={styles.routeText}>
                    Route: {bus.route.slice(0, 3).join(' → ')}...
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {!origin || !destination ? (
            <View style={styles.nearbyStops}>
              <Text style={styles.sectionTitle}>Nearby Bus Stops</Text>
              {busStops.slice(0, 5).map((stop) => (
                <View key={stop.id} style={styles.stopCard}>
                  <MapPin color="#1E40AF" size={18} />
                  <View style={styles.stopInfo}>
                    <Text style={styles.stopName}>{stop.name}</Text>
                    <Text style={styles.stopDistance}>{stop.distance}m away</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </View>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notice</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mapContainer: {
    height: height * 0.6,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholder: {
    width: 40,
  },
  searchBarOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  searchContent: {
    marginLeft: 12,
    flex: 1,
  },
  searchFromText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  searchToText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  routeInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  routeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 16,
  },
  routeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDetailText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  resultsContainer: {
    paddingHorizontal: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  busCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  busNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  busDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  routeText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  nearbyStops: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stopInfo: {
    marginLeft: 12,
    flex: 1,
  },
  stopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  stopDistance: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 280,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});