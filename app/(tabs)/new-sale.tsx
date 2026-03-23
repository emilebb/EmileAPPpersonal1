import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function NewSaleScreen() {
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);

  const startScanning = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return alert('Se necesita permiso de cámara.');
    }
    setIsScanning(true);
  };

  const handleBarcodeScanned = ({ data }: any) => {
    setIsScanning(false);
    setConcept(`Cód: ${data}`);
  };

  const handleCharge = () => {
    if (!amount) return;
    alert(`Cobro exitoso de $${amount} por ${concept || 'Venta General'}`);
    setAmount('');
    setConcept('');
  };

  const addAmount = (val: string) => {
    if (val === '0' && amount === '') return;
    setAmount(prev => prev + val);
  };
  
  const removeAmount = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const NumButton = ({ num }: { num: string }) => (
    <TouchableOpacity style={styles.numBtn} onPress={() => addAmount(num)}>
      <Text style={styles.numText}>{num}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Nueva Venta</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <Text style={styles.amountDisplay}>{amount || '0'}</Text>
        </View>

        <View style={styles.conceptRow}>
          <TextInput
            style={styles.conceptInput}
            placeholder="Concepto (Opcional)"
            placeholderTextColor="#64748b"
            value={concept}
            onChangeText={setConcept}
          />
          <TouchableOpacity style={styles.scanBtn} onPress={startScanning}>
            <Ionicons name="barcode-outline" size={24} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        <View style={styles.keypad}>
          <View style={styles.row}>
            <NumButton num="1" />
            <NumButton num="2" />
            <NumButton num="3" />
          </View>
          <View style={styles.row}>
            <NumButton num="4" />
            <NumButton num="5" />
            <NumButton num="6" />
          </View>
          <View style={styles.row}>
            <NumButton num="7" />
            <NumButton num="8" />
            <NumButton num="9" />
          </View>
          <View style={styles.row}>
            <NumButton num="00" />
            <NumButton num="0" />
            <TouchableOpacity style={styles.numBtn} onPress={removeAmount} onLongPress={() => setAmount('')}>
              <Ionicons name="backspace-outline" size={32} color="#f8fafc" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.chargeBtn, !amount && styles.chargeBtnDisabled]} 
          onPress={handleCharge}
          disabled={!amount}
        >
          <Ionicons name="card" size={24} color="#f8fafc" style={{ marginRight: 10 }} />
          <Text style={styles.chargeBtnText}>Cobrar ${amount || '0'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isScanning} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView 
            style={styles.camera} 
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr", "ean13", "ean8", "pdf417", "code128"] }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraText}>Apunta a un código de barras</Text>
              <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setIsScanning(false)}>
                <Ionicons name="close-circle" size={48} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginVertical: 20,
  },
  currencySymbol: {
    fontSize: 32,
    color: '#4ade80',
    fontWeight: 'bold',
    marginRight: 4,
  },
  amountDisplay: {
    fontSize: 72,
    fontWeight: '900',
    color: '#f8fafc',
  },
  conceptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  conceptInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scanBtn: {
    backgroundColor: '#38bdf8',
    padding: 16,
    borderRadius: 16,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypad: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  numBtn: {
    width: '30%',
    aspectRatio: 1.5,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  numText: {
    fontSize: 32,
    color: '#f8fafc',
    fontWeight: '600',
  },
  chargeBtn: {
    backgroundColor: '#38bdf8',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 20,
  },
  chargeBtnDisabled: {
    backgroundColor: '#334155',
    shadowOpacity: 0,
    elevation: 0,
  },
  chargeBtnText: {
    fontSize: 20,
    color: '#f8fafc',
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
  },
  cameraText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeCameraBtn: {
    backgroundColor: 'white',
    borderRadius: 30,
  },
});
