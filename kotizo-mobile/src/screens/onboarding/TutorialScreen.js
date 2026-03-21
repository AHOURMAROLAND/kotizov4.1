import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Dimensions, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import KButton from '../../components/common/KButton';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Creez vos cotisations',
    description: 'Lancez une collecte en quelques secondes. Partagez le lien et collectez via Mobile Money.',
    color: '#2563EB',
  },
  {
    id: '2',
    title: 'Partagez et collectez',
    description: 'QR Code ou lien WhatsApp — vos proches paient depuis leur telephone sans application.',
    color: '#7C3AED',
  },
  {
    id: '3',
    title: 'Quick Pay instantane',
    description: 'Demandez un paiement rapide. Le montant vous est reverse automatiquement.',
    color: '#059669',
  },
];

export default function TutorialScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('CGU');
    }
  };

  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.illustration, { backgroundColor: item.color + '20' }]}>
        <View style={[styles.illustrationInner, { backgroundColor: item.color }]} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => navigation.replace('CGU')}>
        <Text style={styles.skipText}>Ignorer</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === currentIndex ? '#2563EB' : 'rgba(255,255,255,0.2)', width: i === currentIndex ? 20 : 8 }]}
            />
          ))}
        </View>
        <KButton
          title={currentIndex === slides.length - 1 ? 'Commencer' : 'Suivant'}
          onPress={goNext}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  skip: { position: 'absolute', top: 60, right: 24, zIndex: 10 },
  skipText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  slide: { paddingHorizontal: 32, paddingTop: 80, alignItems: 'center' },
  illustration: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  illustrationInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: { padding: 32, paddingBottom: 40 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  btn: {},
});