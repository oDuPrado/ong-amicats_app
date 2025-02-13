import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  Image,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Cat } from './Gatos'; // Importe a interface Cat de CatsScreen ou declare aqui

interface CatCardProps {
  cat: Cat;
  onPress: (cat: Cat) => void;
}

const CatCard = ({ cat, onPress }: CatCardProps) => {
  const cardScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(cardScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 1,
      bounciness: 12,
    }).start();
  }, [cardScale]);

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity style={styles.cardButton} onPress={() => onPress(cat)}>
        <Image source={{ uri: cat.photo.uri }} style={styles.catImage} />
        <Text style={styles.catName}>{cat.catName}</Text>
        <Text style={styles.catDate}>Atendimento: {cat.appointmentDate}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#374224',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cardButton: {
    width: '100%',
    alignItems: 'center',
    padding: 10,
  },
  catImage: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374224',
  },
  catName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374224',
  },
  catDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
});

export default CatCard;
