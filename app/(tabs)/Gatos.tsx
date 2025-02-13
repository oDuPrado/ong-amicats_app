import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import CatCard from './CatCard'; // Importe o componente criado

export interface Cat {
  id: string;
  cadasterDocId: string;
  catName: string;
  ownerName: string;
  appointmentDate: string;
  photo: { uri: string };
  medicalProblems: { name: string }[];
  medicalDetails: string;
}

interface MedicalRecord {
  id: string;
  name: string;
  weight: string;
  startDate: string;
  medication: string;
  dose: string;
  viaDM: string;
  frequency: string;
  endDate: string;
  obs: string;
  createdBy: string;
  createdAt: string;
}

const CatsScreen = () => {
  const [userName, setUserName] = useState('');
  const [cats, setCats] = useState<Cat[]>([]);
  const [filteredCats, setFilteredCats] = useState<Cat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [catModalVisible, setCatModalVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);

  const [editCatModalVisible, setEditCatModalVisible] = useState(false);
  const [catData, setCatData] = useState<Cat>({
    id: '',
    cadasterDocId: '',
    catName: '',
    ownerName: '',
    appointmentDate: '',
    photo: { uri: '' },
    medicalProblems: [],
    medicalDetails: '',
  });

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  const [newRecordModalVisible, setNewRecordModalVisible] = useState(false);
  const [editRecordModalVisible, setEditRecordModalVisible] = useState(false);

  const [recordData, setRecordData] = useState<MedicalRecord>({
    id: '',
    name: '',
    weight: '',
    startDate: '',
    medication: '',
    dose: '',
    viaDM: '',
    frequency: '',
    endDate: '',
    obs: '',
    createdBy: '',
    createdAt: '',
  });

  const screenOpacity = useRef(new Animated.Value(0)).current;

  // Animação de fade-in ao montar a tela
  useEffect(() => {
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [screenOpacity]);

  // Buscar nome do usuário
  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data()?.name || '');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar nome do usuário logado:', error);
      }
    };
    fetchUserName();
  }, []);

  // Buscar lista de gatos
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cadasterSnap = await getDocs(collection(db, 'Cadaster'));
        const catList: Cat[] = [];

        for (const cadDoc of cadasterSnap.docs) {
          const cadasterDocId = cadDoc.id;
          const catsRef = collection(db, 'Cadaster', cadasterDocId, 'Cats');
          const catsSnap = await getDocs(catsRef);

          catsSnap.forEach((catDoc) => {
            const cat = catDoc.data() as Omit<Cat, 'id' | 'cadasterDocId'>;
            catList.push({
              id: catDoc.id,
              cadasterDocId: cadasterDocId,
              ...cat,
            });
          });
        }
        setCats(catList);
        setFilteredCats(catList);
      } catch (error) {
        console.log('Erro ao buscar gatinhos:', error);
      }
    };

    fetchCats();
  }, []);

  // Filtro de pesquisa
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredCats(cats);
    } else {
      const filtered = cats.filter((c) =>
        c.catName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCats(filtered);
    }
  };

  // Abre/fecha modal de detalhes
  const openCatModal = (cat: Cat) => {
    setSelectedCat(cat);
    setCatModalVisible(true);
  };
  const closeCatModal = () => {
    setCatModalVisible(false);
    setSelectedCat(null);
  };

  // Abre/fecha modal de edição do gatinho
  const openEditCatModal = (cat: Cat) => {
    setCatData(cat);
    setEditCatModalVisible(true);
  };
  const closeEditCatModal = () => {
    setEditCatModalVisible(false);
  };

  // Atualiza dados do gato
  const handleUpdateCat = async () => {
    try {
      const catDocRef = doc(
        db,
        'Cadaster',
        catData.cadasterDocId,
        'Cats',
        catData.id
      );

      await updateDoc(catDocRef, {
        catName: catData.catName,
        ownerName: catData.ownerName,
        appointmentDate: catData.appointmentDate,
        photo: catData.photo,
        medicalProblems: catData.medicalProblems,
        medicalDetails: catData.medicalDetails,
      });

      // Atualiza a lista local
      setCats((prev) =>
        prev.map((c) => (c.id === catData.id ? { ...catData } : c))
      );
      setFilteredCats((prev) =>
        prev.map((c) => (c.id === catData.id ? { ...catData } : c))
      );

      Alert.alert('Sucesso', 'Gatinho editado com sucesso!');
      closeEditCatModal();
      closeCatModal();
    } catch (error) {
      console.error('Erro ao editar gatinho:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o gatinho.');
    }
  };

  // Excluir gato
  const handleDeleteCat = async (cat: Cat) => {
    try {
      Alert.alert(
        'Excluir Gato',
        'Tem certeza que deseja excluir este gatinho?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sim, excluir',
            style: 'destructive',
            onPress: async () => {
              const catDocRef = doc(
                db,
                'Cadaster',
                cat.cadasterDocId,
                'Cats',
                cat.id
              );
              await deleteDoc(catDocRef);

              setCats((prev) => prev.filter((c) => c.id !== cat.id));
              setFilteredCats((prev) => prev.filter((c) => c.id !== cat.id));

              Alert.alert('Sucesso', 'Gato excluído!');
              closeCatModal();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erro ao excluir o gato:', error);
      Alert.alert('Erro', 'Não foi possível excluir o gato.');
    }
  };

  // Abre modal de histórico
  const openHistoryModal = async () => {
    if (!selectedCat) {
      return;
    }
    try {
      const ref = collection(db, 'CatMedicalRecords', selectedCat.id, 'records');
      const snap = await getDocs(ref);

      const records: MedicalRecord[] = [];
      snap.forEach((docSnap) => {
        records.push(docSnap.data() as MedicalRecord);
      });

      // Ordena
      records.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      setMedicalRecords(records);
      setHistoryModalVisible(true);
    } catch (error) {
      console.log('Erro ao buscar prontuários:', error);
    }
  };
  const closeHistoryModal = () => {
    setHistoryModalVisible(false);
    setMedicalRecords([]);
  };

  // Formata data/hora
  const formatDateTime = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Abre/fecha modal de novo prontuário
  const openNewRecordModal = () => {
    if (!selectedCat) {
      return;
    }
    setRecordData({
      id: '',
      name: selectedCat.catName,
      weight: '',
      startDate: '',
      medication: '',
      dose: '',
      viaDM: '',
      frequency: '',
      endDate: '',
      obs: '',
      createdBy: userName || 'Veterinário X',
      createdAt: '',
    });
    setNewRecordModalVisible(true);
  };
  const closeNewRecordModal = () => {
    setNewRecordModalVisible(false);
  };

  // Abre/fecha modal de edição de prontuário
  const openEditRecordModal = (record: MedicalRecord) => {
    setRecordData(record);
    setEditRecordModalVisible(true);
  };
  const closeEditRecordModal = () => {
    setEditRecordModalVisible(false);
  };

  // Salvar novo prontuário
  const handleSaveNewRecord = async () => {
    try {
      if (!selectedCat) {
        return;
      }
      const newRecordId = uuidv4();
      const now = formatDateTime(new Date());

      const newRecord: MedicalRecord = {
        ...recordData,
        id: newRecordId,
        createdAt: now,
      };

      const recordRef = doc(
        db,
        'CatMedicalRecords',
        selectedCat.id,
        'records',
        newRecordId
      );
      await setDoc(recordRef, newRecord);

      setMedicalRecords((prev) => [newRecord, ...prev]);
      closeNewRecordModal();
      Alert.alert('Sucesso', 'Novo prontuário cadastrado!');
    } catch (error) {
      console.log('Erro ao salvar prontuário:', error);
      Alert.alert('Erro', 'Falha ao salvar prontuário.');
    }
  };

  // Atualizar prontuário
  const handleUpdateRecord = async () => {
    try {
      if (!selectedCat) {
        return;
      }
      const updatedDate = formatDateTime(new Date());
      const updatedRecord = {
        ...recordData,
        createdAt: updatedDate,
      };

      const recordRef = doc(
        db,
        'CatMedicalRecords',
        selectedCat.id,
        'records',
        recordData.id
      );
      await updateDoc(recordRef, updatedRecord);

      setMedicalRecords((prev) =>
        prev.map((item) => (item.id === recordData.id ? updatedRecord : item))
      );

      closeEditRecordModal();
      Alert.alert('Sucesso', 'Prontuário atualizado!');
    } catch (error) {
      console.log('Erro ao atualizar prontuário:', error);
      Alert.alert('Erro', 'Falha ao atualizar prontuário.');
    }
  };

  // Excluir prontuário
  const handleDeleteRecord = async (recordId: string) => {
    try {
      if (!selectedCat) {
        return;
      }
      Alert.alert('Excluir Prontuário?', 'Confirma a exclusão deste histórico?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const recordRef = doc(
              db,
              'CatMedicalRecords',
              selectedCat.id,
              'records',
              recordId
            );
            await deleteDoc(recordRef);

            setMedicalRecords((prev) => prev.filter((item) => item.id !== recordId));
            Alert.alert('Sucesso', 'Prontuário excluído!');
          },
        },
      ]);
    } catch (error) {
      console.log('Erro ao excluir prontuário:', error);
      Alert.alert('Erro', 'Falha ao excluir prontuário.');
    }
  };

  // Renderiza um card de gato usando CatCard
  const renderCatCard = ({ item }: { item: Cat }) => {
    return <CatCard cat={item} onPress={openCatModal} />;
  };

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header de busca */}
        <View style={styles.header}>
          <Ionicons name="search" size={24} color="#374224" style={styles.searchIcon} />
          <TextInput
            style={styles.searchBar}
            placeholder="Pesquisar pelo Nome"
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
        </View>

        {/* Lista de gatos */}
        <FlatList
          data={filteredCats}
          renderItem={renderCatCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.rowContainer}
          contentContainerStyle={styles.listContainer}
        />

        {/* Modal de Detalhes do Gato */}
        <Modal
          visible={catModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeCatModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedCat && (
                <ScrollView>
                  <Text style={styles.modalTitle}>{selectedCat.catName}</Text>

                  {/* Botões do Gato */}
                  <View style={{ alignItems: 'center' }}>
                    <Animated.Image
                      source={{ uri: selectedCat.photo.uri }}
                      style={styles.modalImage}
                    />
                  </View>

                  <Text style={styles.modalText}>
                    <Text style={styles.modalLabel}>Dono: </Text>
                    {selectedCat.ownerName}
                  </Text>
                  <Text style={styles.modalText}>
                    <Text style={styles.modalLabel}>Data de Atendimento: </Text>
                    {selectedCat.appointmentDate}
                  </Text>

                  <Text style={styles.modalText}>
                    <Text style={styles.modalLabel}>Problemas Médicos:</Text>
                  </Text>
                  {selectedCat.medicalProblems.map((problem, index) => (
                    <Text key={index} style={styles.modalItemText}>
                      - {problem.name}
                    </Text>
                  ))}

                  <Text style={styles.modalText}>
                    <Text style={styles.modalLabel}>Detalhes: </Text>
                    {selectedCat.medicalDetails}
                  </Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: '#BF2F2F' }]}
                      onPress={() => handleDeleteCat(selectedCat)}
                    >
                      <Ionicons name="trash" size={20} color="#FFFFFF" />
                      <Text style={styles.iconButtonText}>Excluir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: '#2F8CBF' }]}
                      onPress={() => openEditCatModal(selectedCat)}
                    >
                      <Ionicons name="create" size={20} color="#FFFFFF" />
                      <Text style={styles.iconButtonText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: '#4A9B3C' }]}
                      onPress={openHistoryModal}
                    >
                      <Ionicons name="document-text" size={20} color="#FFFFFF" />
                      <Text style={styles.iconButtonText}>Histórico</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.closeButton} onPress={closeCatModal}>
                    <Ionicons name="close-circle" size={28} color="#374224" />
                    <Text style={styles.closeButtonText}>Fechar</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Modal de Edição do Gato */}
        <Modal
          visible={editCatModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeEditCatModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Editar Gatinho</Text>

                <Text style={styles.modalLabel}>Nome do Gato</Text>
                <TextInput
                  style={styles.input}
                  value={catData.catName}
                  onChangeText={(val) => setCatData({ ...catData, catName: val })}
                />

                <Text style={styles.modalLabel}>Nome do Dono</Text>
                <TextInput
                  style={styles.input}
                  value={catData.ownerName}
                  onChangeText={(val) => setCatData({ ...catData, ownerName: val })}
                />

                <Text style={styles.modalLabel}>Data de Atendimento</Text>
                <TextInput
                  style={styles.input}
                  value={catData.appointmentDate}
                  maxLength={10}
                  onChangeText={(val) => setCatData({ ...catData, appointmentDate: val })}
                />

                <Text style={styles.modalLabel}>Observações</Text>
                <TextInput
                  style={styles.multilineInput}
                  multiline
                  value={catData.medicalDetails}
                  onChangeText={(val) => setCatData({ ...catData, medicalDetails: val })}
                />

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: '#4A9B3C' }]}
                    onPress={handleUpdateCat}
                  >
                    <Ionicons name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.iconButtonText}>Salvar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: '#BF2F2F' }]}
                    onPress={closeEditCatModal}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                    <Text style={styles.iconButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de Histórico de Prontuários */}
        <Modal
          visible={historyModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeHistoryModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.historyTitle}>
                Histórico de {selectedCat?.catName}
              </Text>

              <ScrollView style={styles.historyList}>
                {medicalRecords.map((record) => (
                  <TouchableOpacity
                    key={record.id}
                    style={styles.recordCard}
                    onPress={() => openEditRecordModal(record)}
                  >
                    <Text style={styles.recordTitle}>
                      Atualização feita por: {record.createdBy}
                    </Text>
                    <Text style={styles.modalText}>Em: {record.createdAt}</Text>
                    <Text style={styles.modalText}>
                      Medicamento: {record.medication}
                    </Text>
                    <Text style={styles.hintText}>
                      (Toque para ver ou editar detalhes)
                    </Text>
                    <TouchableOpacity
                      style={[styles.iconButton, { backgroundColor: '#BF2F2F', marginTop: 10 }]}
                      onPress={() => handleDeleteRecord(record.id)}
                    >
                      <Ionicons name="trash" size={20} color="#FFFFFF" />
                      <Text style={styles.iconButtonText}>Excluir</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: '#4A9B3C', alignSelf: 'center' }]}
                onPress={openNewRecordModal}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.iconButtonText}>Novo Prontuário</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeButton} onPress={closeHistoryModal}>
                <Ionicons name="arrow-down-circle" size={28} color="#374224" />
                <Text style={styles.closeButtonText}>Fechar Histórico</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de Novo Prontuário */}
        <Modal
          visible={newRecordModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeNewRecordModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Cadastrar Prontuário</Text>

                <Text style={styles.modalLabel}>Nome</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.name}
                  onChangeText={(val) => setRecordData({ ...recordData, name: val })}
                />

                <Text style={styles.modalLabel}>Peso (KG)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={recordData.weight}
                  onChangeText={(val) => setRecordData({ ...recordData, weight: val })}
                />

                <Text style={styles.modalLabel}>Data de Início</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.startDate}
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  onChangeText={(text) => {
                    const formattedText = text
                      .replace(/\D/g, '')
                      .replace(/(\d{2})(\d)/, '$1/$2')
                      .replace(/(\d{2})(\d)/, '$1/$2')
                      .replace(/(\d{4})(\d)/, '$1');
                    setRecordData({ ...recordData, startDate: formattedText });
                  }}
                />

                <Text style={styles.modalLabel}>Medicamento</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.medication}
                  onChangeText={(val) => setRecordData({ ...recordData, medication: val })}
                />

                <Text style={styles.modalLabel}>Dose</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.dose}
                  onChangeText={(val) => setRecordData({ ...recordData, dose: val })}
                />

                <Text style={styles.modalLabel}>Via DM</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.viaDM}
                  onChangeText={(val) => setRecordData({ ...recordData, viaDM: val })}
                />

                <Text style={styles.modalLabel}>Frequência</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.frequency}
                  onChangeText={(val) => setRecordData({ ...recordData, frequency: val })}
                />

                <Text style={styles.modalLabel}>Data de Término</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.endDate}
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  onChangeText={(text) => {
                    const formattedText = text
                      .replace(/\D/g, '')
                      .replace(/(\d{2})(\d)/, '$1/$2')
                      .replace(/(\d{2})(\d)/, '$1/$2')
                      .replace(/(\d{4})(\d)/, '$1');
                    setRecordData({ ...recordData, endDate: formattedText });
                  }}
                />

                <Text style={styles.modalLabel}>Observações</Text>
                <TextInput
                  style={styles.multilineInput}
                  multiline
                  value={recordData.obs}
                  onChangeText={(val) => setRecordData({ ...recordData, obs: val })}
                />

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: '#4A9B3C' }]}
                    onPress={handleSaveNewRecord}
                  >
                    <Ionicons name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.iconButtonText}>Salvar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: '#BF2F2F' }]}
                    onPress={closeNewRecordModal}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                    <Text style={styles.iconButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de Edição de Prontuário */}
        <Modal
          visible={editRecordModalVisible}
          transparent
          animationType="fade"
          onRequestClose={closeEditRecordModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Editar Prontuário</Text>

                <Text style={styles.modalLabel}>Nome</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.name}
                  onChangeText={(val) => setRecordData({ ...recordData, name: val })}
                />

                <Text style={styles.modalLabel}>Peso (KG)</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.weight}
                  keyboardType="numeric"
                  onChangeText={(val) => setRecordData({ ...recordData, weight: val })}
                />

                <Text style={styles.modalLabel}>Data de Início</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.startDate}
                  maxLength={10}
                  onChangeText={(text) => {
                    const formattedText = text
                      .replace(/\D/g, '')
                      .replace(/(\d{2})(\d)/, '$1/$2')
                      .replace(/(\d{2})(\d)/, '$1/$2')
                      .replace(/(\d{4})(\d)/, '$1');
                    setRecordData({ ...recordData, startDate: formattedText });
                  }}
                />

                <Text style={styles.modalLabel}>Medicamento</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.medication}
                  onChangeText={(val) => setRecordData({ ...recordData, medication: val })}
                />

                <Text style={styles.modalLabel}>Dose</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.dose}
                  onChangeText={(val) => setRecordData({ ...recordData, dose: val })}
                />

                <Text style={styles.modalLabel}>Via DM</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.viaDM}
                  onChangeText={(val) => setRecordData({ ...recordData, viaDM: val })}
                />

                <Text style={styles.modalLabel}>Frequência</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.frequency}
                  onChangeText={(val) => setRecordData({ ...recordData, frequency: val })}
                />

                <Text style={styles.modalLabel}>Data de Término</Text>
                <TextInput
                  style={styles.input}
                  value={recordData.endDate}
                  maxLength={10}
                  onChangeText={(text) => {
                    const formattedText = text
                      .replace(/\D/g, '')
                      .replace(/(\d{2})(\d)/, '$1/$2')
                      .replace(/(\d{2})(\d)/, '$1/$2')
                      .replace(/(\d{4})(\d)/, '$1');
                    setRecordData({ ...recordData, endDate: formattedText });
                  }}
                />

                <Text style={styles.modalLabel}>Observações</Text>
                <TextInput
                  style={styles.multilineInput}
                  multiline
                  value={recordData.obs}
                  onChangeText={(val) => setRecordData({ ...recordData, obs: val })}
                />

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: '#4A9B3C' }]}
                    onPress={handleUpdateRecord}
                  >
                    <Ionicons name="save" size={20} color="#FFFFFF" />
                    <Text style={styles.iconButtonText}>Salvar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconButton, { backgroundColor: '#BF2F2F' }]}
                    onPress={closeEditRecordModal}
                  >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                    <Text style={styles.iconButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B6E388',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#F9FFEF',
    padding: 8,
    margin: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374224',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 6,
  },
  listContainer: {
    paddingBottom: 20,
  },
  rowContainer: {
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#F9FFEF',
    borderRadius: 12,
    padding: 16,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#374224',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374224',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  modalItemText: {
    fontSize: 15,
    color: '#444',
    marginLeft: 8,
    marginBottom: 2,
  },
  modalLabel: {
    fontWeight: 'bold',
    color: '#374224',
  },
  modalImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#374224',
    resizeMode: 'cover',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374224',
    marginBottom: 10,
    textAlign: 'center',
  },
  historyList: {
    maxHeight: 400,
  },
  recordCard: {
    backgroundColor: '#F9FFEF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374224',
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374224',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#374224',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  multilineInput: {
    borderWidth: 1,
    borderColor: '#374224',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    height: 80,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  iconButtonText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#374224',
    marginLeft: 6,
    fontSize: 16,
  },
});

export default CatsScreen;
