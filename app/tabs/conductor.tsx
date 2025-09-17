import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Shield, 
  Play, 
  Square, 
  RotateCcw, 
  Plus, 
  Minus, 
  QrCode, 
  Phone,
  MapPin,
  Users,
  Map
} from 'lucide-react-native';
import { useConductorData } from '@/hooks/useConductorData';
import { QRCodeScanner } from '@/components/QRCodeScanner';
import { DynamicMap } from '@/components/DynamicMap';
import { BusLocation, useLocationService } from '@/hooks/useLocationService';

const { height } = Dimensions.get('window');

export default function ConductorScreen() {
  const insets = useSafeAreaInsets();
  const [isVerified, setIsVerified] = useState(false);
  const [conductorId, setConductorId] = useState('');
  const [password, setPassword] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [newStop, setNewStop] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
  const { currentLocation } = useLocationService();
  
  const {
    tripStatus,
    passengerCount,
    currentStops,
    startTrip,
    endTrip,
    resetTrip,
    addPassenger,
    removePassenger,
    addStop,
    removeStop
  } = useConductorData();

  useEffect(() => {
    if (isVerified && tripStatus === 'active') {
      // Simulate conductor's bus location
      const mockBusLocation: BusLocation = {
        busId: 'conductor-bus',
        busNumber: 'C001',
        latitude: currentLocation?.latitude || 28.6139,
        longitude: currentLocation?.longitude || 77.2090,
        heading: Math.random() * 360,
        speed: 30 + Math.random() * 20,
      };
      setBusLocation(mockBusLocation);
      
      // Update location every 10 seconds during active trip
      const interval = setInterval(() => {
        setBusLocation(prev => prev ? {
          ...prev,
          latitude: prev.latitude + (Math.random() - 0.5) * 0.002,
          longitude: prev.longitude + (Math.random() - 0.5) * 0.002,
          heading: (prev.heading || 0) + (Math.random() - 0.5) * 30,
          speed: 20 + Math.random() * 40,
        } : null);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isVerified, tripStatus, currentLocation]);

  const showMessage = (title: string, message: string) => {
    if (!title.trim() || title.length > 100) return;
    if (!message.trim() || message.length > 200) return;
    const sanitizedTitle = title.trim();
    const sanitizedMessage = message.trim();
    setModalTitle(sanitizedTitle);
    setModalMessage(sanitizedMessage);
    setShowModal(true);
  };

  const handleVerification = () => {
    if (!conductorId.trim() || !password.trim()) {
      showMessage('Error', 'Please enter both Conductor ID and Password');
      return;
    }
    
    if (conductorId.length > 50 || password.length > 50) {
      showMessage('Error', 'Credentials are too long');
      return;
    }
    
    const sanitizedId = conductorId.trim();
    const sanitizedPassword = password.trim();
    
    if (sanitizedId === 'COND001' && sanitizedPassword === 'password123') {
      setIsVerified(true);
      showMessage('Success', 'Verification successful!');
    } else {
      showMessage('Error', 'Invalid credentials');
    }
  };

  const handleQRScan = (data: string) => {
    addPassenger();
    setShowScanner(false);
    showMessage('Success', 'Passenger added via QR scan!');
  };

  const callEmergency = () => {
    showMessage('Emergency Call', 'Emergency services (100) have been contacted');
  };

  const handleAddStop = () => {
    if (!newStop.trim()) {
      showMessage('Error', 'Please enter a stop name');
      return;
    }
    
    if (newStop.length > 100) {
      showMessage('Error', 'Stop name is too long');
      return;
    }
    
    const sanitizedStop = newStop.trim();
    addStop(sanitizedStop);
    setNewStop('');
  };

  if (showScanner) {
    return (
      <QRCodeScanner
        onScan={handleQRScan}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  if (!isVerified) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.verificationContainer}>
          <Shield color="#1E40AF" size={64} />
          <Text style={styles.verificationTitle}>Conductor Verification</Text>
          <Text style={styles.verificationSubtitle}>Please verify your identity to continue</Text>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Conductor ID"
              value={conductorId}
              onChangeText={setConductorId}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />
          </View>
          
          <TouchableOpacity style={styles.verifyButton} onPress={handleVerification}>
            <Text style={styles.verifyButtonText}>Verify Identity</Text>
          </TouchableOpacity>
          
          <Text style={styles.demoText}>Demo: Use COND001 / password123</Text>
        </View>
        
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
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

  if (showMap && tripStatus === 'active') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.mapContainer}>
          <DynamicMap
            currentLocation={currentLocation}
            busLocations={busLocation ? [busLocation] : []}
            style={styles.map}
            showUserLocation={true}
            followUserLocation={true}
          />
          
          <View style={styles.mapOverlay}>
            <TouchableOpacity 
              style={styles.mapCloseButton}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.mapCloseText}>Close Map</Text>
            </TouchableOpacity>
            
            <View style={styles.mapInfo}>
              <Text style={styles.mapInfoTitle}>Live Location</Text>
              <Text style={styles.mapInfoText}>Speed: {Math.round(busLocation?.speed || 0)} km/h</Text>
              <Text style={styles.mapInfoText}>Passengers: {passengerCount}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Conductor Dashboard</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: tripStatus === 'active' ? '#059669' : '#9CA3AF' }]} />
            <Text style={styles.statusText}>Trip {tripStatus}</Text>
          </View>
        </View>

        <View style={styles.tripControls}>
          <Text style={styles.sectionTitle}>Trip Controls</Text>
          <View style={styles.controlButtons}>
            <TouchableOpacity
              style={[styles.controlButton, styles.startButton]}
              onPress={startTrip}
              disabled={tripStatus === 'active'}
            >
              <Play color="#FFFFFF" size={20} />
              <Text style={styles.controlButtonText}>Start Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.endButton]}
              onPress={endTrip}
              disabled={tripStatus !== 'active'}
            >
              <Square color="#FFFFFF" size={20} />
              <Text style={styles.controlButtonText}>End Trip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.resetButton]}
              onPress={resetTrip}
            >
              <RotateCcw color="#FFFFFF" size={20} />
              <Text style={styles.controlButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.passengerSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Passenger Count</Text>
            {tripStatus === 'active' && (
              <TouchableOpacity 
                style={styles.mapButton}
                onPress={() => setShowMap(true)}
              >
                <Map color="#1E40AF" size={20} />
                <Text style={styles.mapButtonText}>View Map</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.passengerCard}>
            <Users color="#1E40AF" size={32} />
            <Text style={styles.passengerCount}>{passengerCount}</Text>
            <Text style={styles.passengerLabel}>Passengers</Text>
          </View>
          
          <View style={styles.passengerControls}>
            <TouchableOpacity
              style={styles.passengerButton}
              onPress={removePassenger}
            >
              <Minus color="#FFFFFF" size={20} />
              <Text style={styles.passengerButtonText}>Remove</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.passengerButton, styles.addButton]}
              onPress={addPassenger}
            >
              <Plus color="#FFFFFF" size={20} />
              <Text style={styles.passengerButtonText}>Add Manual</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.passengerButton, styles.scanButton]}
              onPress={() => setShowScanner(true)}
            >
              <QrCode color="#FFFFFF" size={20} />
              <Text style={styles.passengerButtonText}>Scan QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.stopsSection}>
          <Text style={styles.sectionTitle}>Manage Stops</Text>
          
          <View style={styles.addStopContainer}>
            <TextInput
              style={styles.stopInput}
              placeholder="Add new stop"
              value={newStop}
              onChangeText={setNewStop}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.addStopButton} onPress={handleAddStop}>
              <Plus color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.stopsList}>
            {currentStops.map((stop, index) => (
              <View key={`${stop}-${index}`} style={styles.stopItem}>
                <MapPin color="#1E40AF" size={18} />
                <Text style={styles.stopName}>{stop}</Text>
                <TouchableOpacity
                  style={styles.removeStopButton}
                  onPress={() => removeStop(index)}
                >
                  <Minus color="#DC2626" size={16} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.emergencyButton} onPress={callEmergency}>
          <Phone color="#FFFFFF" size={20} />
          <Text style={styles.emergencyText}>Emergency Call (100)</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
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
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mapCloseButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  mapInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  mapInfoText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },
  verificationSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  verifyButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 16,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  demoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  tripControls: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  startButton: {
    backgroundColor: '#059669',
  },
  endButton: {
    backgroundColor: '#DC2626',
  },
  resetButton: {
    backgroundColor: '#EA580C',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  passengerSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  passengerCard: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  passengerCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  passengerLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  passengerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passengerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  addButton: {
    backgroundColor: '#059669',
  },
  scanButton: {
    backgroundColor: '#1E40AF',
  },
  passengerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  stopsSection: {
    padding: 20,
  },
  addStopContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stopInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 12,
  },
  addStopButton: {
    backgroundColor: '#1E40AF',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stopName: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  removeStopButton: {
    padding: 4,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  emergencyText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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