import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';

const HomeScreen = () => {
  const navigation = useNavigation();

  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalCats, setTotalCats] = useState(0);

  // Animação de slide e fade
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data()?.name || '');
          }
        }

        let catCount = 0;
        const cadasterSnap = await getDocs(collection(db, 'Cadaster'));
        for (const cadDoc of cadasterSnap.docs) {
          const catsSnap = await getDocs(collection(db, 'Cadaster', cadDoc.id, 'Cats'));
          catCount += catsSnap.size;
        }
        setTotalCats(catCount);
      } catch (error) {
        console.log('Erro ao carregar dados da Home:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 15,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  const handleGoToCats = () => {
    navigation.navigate('Gatos' as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#333" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Animated.View
          style={[
            styles.animatedBox,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Image
            source={require('../../assets/images/pokemon_ms_logo.jpg')}
            style={styles.logo}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.animatedBox,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Text style={styles.title}>
            Bem-vindo{userName ? `, ${userName}` : ''}!
          </Text>
          <Text style={styles.subtitle}>Essa é a ONG AMICAT'S.</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Total de gatinhos cadastrados:{' '}
              <Text style={styles.infoHighlight}>{totalCats}</Text>
            </Text>
            <Text style={styles.infoText}>
              Aqui você pode gerenciar cadastros, prontuários e muito mais.
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleGoToCats}>
            <Ionicons name="paw" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Ver Gatinhos</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B6E388',
  },
  contentContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  animatedBox: {
    width: '100%',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374224',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#526A3C',
    marginHorizontal: 10,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginVertical: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  infoHighlight: {
    fontWeight: 'bold',
    color: '#374224',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#4A9B3C',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

