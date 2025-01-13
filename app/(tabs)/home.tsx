// HomeScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Button,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig';

const HomeScreen = () => {
  const navigation = useNavigation();

  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [totalCats, setTotalCats] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Pegar dados do usuário logado
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data()?.name || '');
          }
        }

        // 2) Contar a quantidade total de gatinhos
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

  const handleGoToCats = () => {
    navigation.navigate('Gatos' as never); // Caminho correto da rota
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
        {/* Logo da ONG */}
        <Image
          source={require('../../assets/images/pokemon_ms_logo.jpg')}
          style={styles.logo}
        />

        {/* Título e Boas-vindas */}
        <Text style={styles.title}>Bem-vindo{userName ? `, ${userName}` : ''}!</Text>
        <Text style={styles.subtitle}>Essa é a ONG AMICAT'S.</Text>

        {/* Estatísticas */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Total de gatinhos cadastrados: <Text style={styles.infoHighlight}>{totalCats}</Text>
          </Text>
          <Text style={styles.infoText}>
            Aqui você pode gerenciar cadastros, prontuários e muito mais.
          </Text>
        </View>

        {/* Botão para ver a lista de gatos */}
        <View style={styles.buttonContainer}>
          <Button title="Ver Gatinhos" onPress={handleGoToCats} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B6E388', // Verde claro semelhante ao fundo da logo
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
    color: '#333', // Texto neutro que combina com o contorno da logo
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24, // Tamanho ligeiramente maior para destacar o título
    fontWeight: 'bold',
    color: '#374224', // Verde escuro, semelhante às linhas do gato na logo
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#526A3C', // Verde intermediário para manter harmonia
    marginHorizontal: 10,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: '#FFFFFF', // Branco para destacar as informações
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
    color: '#333', // Texto neutro para manter a legibilidade
    marginBottom: 8,
  },
  infoHighlight: {
    fontWeight: 'bold',
    color: '#374224', // Verde escuro para dar ênfase
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
});
