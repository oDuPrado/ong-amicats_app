import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
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

// Tipos
interface Cat {
  id: string;
  cadasterDocId: string; // IMPORTANTE: guarda o ID do doc do "Cadaster" em que o gato está
  catName: string;
  ownerName: string;
  appointmentDate: string;
  photo: { uri: string };
  medicalProblems: { name: string }[];
  medicalDetails: string;
}

interface MedicalRecord {
  id: string;
  name: string;       // Nome do gatinho
  weight: string;     // Peso em KG
  startDate: string;  // Data de início do atendimento
  medication: string;
  dose: string;
  viaDM: string;
  frequency: string;
  endDate: string;
  obs: string;
  createdBy: string;
  createdAt: string;  // data/hora formatada
}

const CatsScreen = () => {
  const [userName, setUserName] = useState('');
  const [cats, setCats] = useState<Cat[]>([]);
  const [filteredCats, setFilteredCats] = useState<Cat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal principal de detalhes do gatinho
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);

  // Modal para editar dados do próprio gatinho
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

  // Modal do histórico (prontuários) do gatinho
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  // Modal para cadastrar um novo prontuário
  const [newRecordModalVisible, setNewRecordModalVisible] = useState(false);
  // Modal para editar um prontuário
  const [editRecordModalVisible, setEditRecordModalVisible] = useState(false);
  // Dados de prontuário em edição
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

  // ============ FUNÇÃO DE FORMATAÇÃO DE DATA/HORA (dd/mm/aaaa hh:mm) ============
  const formatDateTime = (date: Date) => {
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
  };

  // ============= PEGAR DADOS DO USUÁRIO LOGADO =============
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

  // ============= BUSCAR TODOS OS GATOS AO ENTRAR NA TELA =============
  useEffect(() => {
    const fetchCats = async () => {
      try {
        console.log('Buscando gatinhos em Cadaster/.../Cats');
        const cadasterSnap = await getDocs(collection(db, 'Cadaster'));
        const catList: Cat[] = [];

        // Para cada documento dentro de "Cadaster"
        for (const cadDoc of cadasterSnap.docs) {
          const cadasterDocId = cadDoc.id; // ex: d5f5416c-7d6f-4a43-ac5c-015669cd2f4f
          const catsRef = collection(db, 'Cadaster', cadasterDocId, 'Cats');
          const catsSnap = await getDocs(catsRef);

          catsSnap.forEach((catDoc) => {
            const catData = catDoc.data() as Omit<Cat, 'id' | 'cadasterDocId'>;
            catList.push({
              id: catDoc.id,
              cadasterDocId: cadasterDocId,
              ...catData,
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

  // ============= FILTRO DA BARRA DE PESQUISA =============
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

  // ============= ABRE/FECHA MODAL DE DETALHES =============
  const openCatModal = (cat: Cat) => {
    setSelectedCat(cat);
    setCatModalVisible(true);
  };
  const closeCatModal = () => {
    setCatModalVisible(false);
    setSelectedCat(null);
  };

  // ============= ABRE/FECHA MODAL DE EDIÇÃO DO GATINHO =============
  const openEditCatModal = (cat: Cat) => {
    setCatData(cat);
    setEditCatModalVisible(true);
  };
  const closeEditCatModal = () => {
    setEditCatModalVisible(false);
  };

  // ============= ATUALIZAR DADOS DO GATINHO =============
  const handleUpdateCat = async () => {
    try {
      // Precisamos do cadasterDocId e do catData.id
      const catDocRef = doc(
        db,
        'Cadaster',
        catData.cadasterDocId, // ex: d5f5416c-7d6f-4a43-ac5c-015669cd2f4f
        'Cats',
        catData.id            // ex: 123e4567-e89b-12d3-a456-426614174000
      );

      await updateDoc(catDocRef, {
        catName: catData.catName,
        ownerName: catData.ownerName,
        appointmentDate: catData.appointmentDate,
        photo: catData.photo,
        medicalProblems: catData.medicalProblems,
        medicalDetails: catData.medicalDetails,
      });

      // Atualizar localmente
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

  // ============= EXCLUIR GATINHO =============
  const handleDeleteCat = async (cat: Cat) => {
    try {
      Alert.alert('Excluir Gato', 'Tem certeza que deseja excluir este gatinho?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, excluir',
          onPress: async () => {
            const catDocRef = doc(
              db,
              'Cadaster',
              cat.cadasterDocId,
              'Cats',
              cat.id
            );
            await deleteDoc(catDocRef);

            // Remover localmente
            setCats((prev) => prev.filter((c) => c.id !== cat.id));
            setFilteredCats((prev) => prev.filter((c) => c.id !== cat.id));

            Alert.alert('Sucesso', 'Gato excluído!');
            closeCatModal();
          },
        },
      ]);
    } catch (error) {
      console.error('Erro ao excluir o gato:', error);
      Alert.alert('Erro', 'Não foi possível excluir o gato.');
    }
  };

  // ============= HISTÓRICO (PRONTUÁRIOS) =============
  const openHistoryModal = async () => {
    if (!selectedCat) return;
    try {
      // Coleção top-level "CatMedicalRecords" -> doc(selectedCat.id) -> subcoleção "records"
      const ref = collection(db, 'CatMedicalRecords', selectedCat.id, 'records');
      const snap = await getDocs(ref);

      const records: MedicalRecord[] = [];
      snap.forEach((docSnap) => {
        records.push(docSnap.data() as MedicalRecord);
      });

      // Ordena decrescente por data se quiser
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

  // ============= CRIAR/EDITAR PRONTUÁRIO =============
  const openNewRecordModal = () => {
    if (!selectedCat) return;
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

  const openEditRecordModal = (record: MedicalRecord) => {
    setRecordData(record);
    setEditRecordModalVisible(true);
  };
  const closeEditRecordModal = () => {
    setEditRecordModalVisible(false);
  };

  const handleSaveNewRecord = async () => {
    try {
      if (!selectedCat) return;
      const newRecordId = uuidv4();
      const now = formatDateTime(new Date());

      const newRecord: MedicalRecord = {
        ...recordData,
        id: newRecordId,
        createdAt: now,
      };

      // Salva no Firestore
      const recordRef = doc(db, 'CatMedicalRecords', selectedCat.id, 'records', newRecordId);
      await setDoc(recordRef, newRecord);

      // Atualiza local
      setMedicalRecords((prev) => [newRecord, ...prev]);
      closeNewRecordModal();
      Alert.alert('Sucesso', 'Novo prontuário cadastrado!');
    } catch (error) {
      console.log('Erro ao salvar prontuário:', error);
      Alert.alert('Erro', 'Falha ao salvar prontuário.');
    }
  };

  const handleUpdateRecord = async () => {
    try {
      if (!selectedCat) return;
      const updatedDate = formatDateTime(new Date());
      const updatedRecord = {
        ...recordData,
        createdAt: updatedDate,
      };

      // Atualiza no Firestore
      const recordRef = doc(db, 'CatMedicalRecords', selectedCat.id, 'records', recordData.id);
      await updateDoc(recordRef, updatedRecord);

      // Atualiza local
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

  const handleDeleteRecord = async (recordId: string) => {
    try {
      if (!selectedCat) return;
      Alert.alert('Excluir Prontuário?', 'Confirma a exclusão deste histórico?', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const recordRef = doc(db, 'CatMedicalRecords', selectedCat.id, 'records', recordId);
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

  // ============= RENDERIZAÇÃO DOS CARDS DE GATINHOS =============
  const renderCatCard = ({ item }: { item: Cat }) => (
    <TouchableOpacity style={styles.card} onPress={() => openCatModal(item)}>
      <Image source={{ uri: item.photo.uri }} style={styles.catImage} />
      <Text style={styles.catName}>{item.catName}</Text>
      <Text style={styles.catDate}>Atendimento: {item.appointmentDate}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra de pesquisa */}
      <TextInput
        style={styles.searchBar}
        placeholder="Pesquisar pelo Nome"
        value={searchQuery}
        onChangeText={handleSearch}
      />

      {/* Lista em 2 colunas */}
      <FlatList
        data={filteredCats}
        renderItem={renderCatCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.rowContainer}
        contentContainerStyle={styles.listContainer}
      />

      {/* ============= MODAL DE DETALHES DO GATO ============= */}
      <Modal
        visible={catModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeCatModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCat && (
              <ScrollView>
                <Text style={styles.modalTitle}>{selectedCat.catName}</Text>
                <Image
                  source={{ uri: selectedCat.photo.uri }}
                  style={styles.modalImage}
                />
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Dono:</Text> {selectedCat.ownerName}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Data de Atendimento:</Text>{' '}
                  {selectedCat.appointmentDate}
                </Text>

                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Problemas Médicos:</Text>
                </Text>
                {selectedCat.medicalProblems.map((problem, i) => (
                  <Text key={i} style={styles.modalText}>
                    - {problem.name}
                  </Text>
                ))}

                <Text style={styles.modalText}>
                  <Text style={styles.modalLabel}>Detalhes:</Text>{' '}
                  {selectedCat.medicalDetails}
                </Text>

                {/* Botões de ação */}
                <View style={styles.buttonContainer}>
                  <Button
                    title="Excluir"
                    color="red"
                    onPress={() => handleDeleteCat(selectedCat)}
                  />
                  <Button
                    title="Editar"
                    onPress={() => openEditCatModal(selectedCat)}
                  />
                  <Button
                    title="Atualizar"
                    onPress={openHistoryModal}
                  />
                </View>

                <Button title="Fechar" onPress={closeCatModal} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ============= MODAL PARA EDITAR GATINHO ============= */}
      <Modal
        visible={editCatModalVisible}
        transparent
        animationType="slide"
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
                onChangeText={(val) =>
                  setCatData({ ...catData, appointmentDate: val })
                }
              />

              <Text style={styles.modalLabel}>Observações</Text>
              <TextInput
                style={styles.input}
                value={catData.medicalDetails}
                onChangeText={(val) =>
                  setCatData({ ...catData, medicalDetails: val })
                }
              />

              {/* Caso queira editar photo, medicalProblems etc., faça aqui também */}

              <Button title="Salvar" onPress={handleUpdateCat} />
              <Button title="Cancelar" onPress={closeEditCatModal} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============= MODAL DO HISTÓRICO (PRONTUÁRIOS) ============= */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeHistoryModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.historyTitle}>
              Histórico de {selectedCat?.catName}
            </Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {medicalRecords.map((record) => (
                <TouchableOpacity
                  key={record.id}
                  style={styles.recordCard}
                  onPress={() => openEditRecordModal(record)}
                >
                  <Text style={styles.recordTitle}>
                    Atualização feita por: {record.createdBy}
                  </Text>
                  <Text>Em: {record.createdAt}</Text>
                  <Text>Medicamento: {record.medication}</Text>
                  <Text style={{ color: 'gray', marginTop: 4 }}>
                    (Toque para ver/editar detalhes)
                  </Text>
                  <Button
                    title="Excluir Prontuário"
                    color="red"
                    onPress={() => handleDeleteRecord(record.id)}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ marginVertical: 10 }}>
              <Button title="Cadastrar Novo Prontuário" onPress={openNewRecordModal} />
            </View>

            <Button title="Fechar Histórico" onPress={closeHistoryModal} />
          </View>
        </View>
      </Modal>

      {/* ============= MODAL PARA CADASTRAR NOVO PRONTUÁRIO ============= */}
      <Modal
        visible={newRecordModalVisible}
        transparent
        animationType="slide"
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
                  let formattedText = text
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
                onChangeText={(val) =>
                  setRecordData({ ...recordData, medication: val })
                }
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
                onChangeText={(val) =>
                  setRecordData({ ...recordData, frequency: val })
                }
              />

              <Text style={styles.modalLabel}>Data de Término</Text>
              <TextInput
                style={styles.input}
                value={recordData.endDate}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                onChangeText={(text) => {
                  let formattedText = text
                    .replace(/\D/g, '')
                    .replace(/(\d{2})(\d)/, '$1/$2')
                    .replace(/(\d{2})(\d)/, '$1/$2')
                    .replace(/(\d{4})(\d)/, '$1');
                  setRecordData({ ...recordData, endDate: formattedText });
                }}
              />

              <Text style={styles.modalLabel}>Observações</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
                value={recordData.obs}
                onChangeText={(val) => setRecordData({ ...recordData, obs: val })}
              />

              <Button title="Salvar" onPress={handleSaveNewRecord} />
              <Button title="Cancelar" onPress={closeNewRecordModal} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============= MODAL PARA EDITAR PRONTUÁRIO ============= */}
      <Modal
        visible={editRecordModalVisible}
        transparent
        animationType="slide"
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
                  let formattedText = text
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
                onChangeText={(val) =>
                  setRecordData({ ...recordData, medication: val })
                }
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
                onChangeText={(val) =>
                  setRecordData({ ...recordData, frequency: val })
                }
              />

              <Text style={styles.modalLabel}>Data de Término</Text>
              <TextInput
                style={styles.input}
                value={recordData.endDate}
                maxLength={10}
                onChangeText={(text) => {
                  let formattedText = text
                    .replace(/\D/g, '')
                    .replace(/(\d{2})(\d)/, '$1/$2')
                    .replace(/(\d{2})(\d)/, '$1/$2')
                    .replace(/(\d{4})(\d)/, '$1');
                  setRecordData({ ...recordData, endDate: formattedText });
                }}
              />

              <Text style={styles.modalLabel}>Observações</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
                value={recordData.obs}
                onChangeText={(val) => setRecordData({ ...recordData, obs: val })}
              />

              <Button title="Salvar Edição" onPress={handleUpdateRecord} />
              <Button title="Cancelar" onPress={closeEditRecordModal} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ============= ESTILOS =============
// ============= ESTILOS =============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B6E388', // Verde claro semelhante ao fundo da logo
    padding: 10,
  },
  searchBar: {
    height: 40,
    borderColor: '#374224', // Verde escuro para os detalhes
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#F9FFEF', // Verde bem claro para contraste
    color: '#333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  rowContainer: {
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginVertical: 10,
    marginRight: 5,
    marginLeft: 5,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#374224', // Verde escuro para sombras suaves
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  catImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374224', // Contorno verde escuro
  },
  catName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374224', // Verde escuro
  },
  catDate: {
    fontSize: 14,
    color: '#666', // Neutro
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#F9FFEF', // Verde bem claro
    borderRadius: 12,
    padding: 16,
    maxHeight: '90%',
    borderColor: '#374224', // Borda verde escuro
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374224',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#333', // Neutro para textos principais
    marginBottom: 5,
  },
  modalLabel: {
    fontWeight: 'bold',
    color: '#374224', // Destaque verde escuro
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374224',
    marginBottom: 10,
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
});

export default CatsScreen;

