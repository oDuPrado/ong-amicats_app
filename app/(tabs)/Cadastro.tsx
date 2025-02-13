import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

interface FormData {
  ownerName: string;
  catName: string;
  appointmentDate: string;
  medicalProblems: { id: string; name: string }[];
  medicalDetails: string;
}

const medicalProblemsList = [
  { id: '1', name: 'Alergias' },
  { id: '2', name: 'Artrite' },
  { id: '3', name: 'Asma' },
  { id: '4', name: 'Diabetes' },
  { id: '5', name: 'Doença Renal' },
  { id: '6', name: 'Obesidade' },
  { id: '7', name: 'Problemas Dentários' },
  { id: '8', name: 'Infecções Urinárias' },
  { id: '9', name: 'Hipertireoidismo' },
  { id: '10', name: 'Doenças de Pele' },
];

const schema = yup.object().shape({
  ownerName: yup.string().required('Nome do proprietário é obrigatório'),
  catName: yup.string().required('Nome do gato é obrigatório'),
  appointmentDate: yup
    .string()
    .matches(
      /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
      'Data deve estar no formato dd/mm/aaaa'
    )
    .required('Data do atendimento é obrigatória'),
  medicalProblems: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.string().required(),
        name: yup.string().required(),
      })
    )
    .required('Problemas médicos são obrigatórios')
    .default([]),
  medicalDetails: yup.string().required('Detalhes médicos são obrigatórios'),
});

const CatMedicalForm = () => {
  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const [selectedProblems, setSelectedProblems] = useState<
    { id: string; name: string }[]
  >([]);
  const [fadeAnim] = useState(new Animated.Value(0));

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      ownerName: '',
      catName: '',
      appointmentDate: '',
      medicalProblems: [],
      medicalDetails: '',
    },
  });

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir o acesso à câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto({ uri: result.assets[0].uri });
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const cadasterId = 'd5f5416c-7d6f-4a43-ac5c-015669cd2f4f';
      const catId = uuidv4();
      const submissionData = { ...data, medicalProblems: selectedProblems, photo };

      const catRef = doc(db, 'Cadaster', cadasterId, 'Cats', catId);
      await setDoc(catRef, submissionData);

      Alert.alert('Sucesso', 'Cadastro realizado com sucesso!');
      reset();
      setSelectedProblems([]);
      setPhoto(null);
    } catch (error) {
      console.error('Erro ao salvar no Firebase:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao salvar o cadastro.');
    }
  };

  const handleAddProblem = (id: string) => {
    const problem = medicalProblemsList.find((item) => item.id === id);
    if (problem && !selectedProblems.find((item) => item.id === id)) {
      setSelectedProblems((prev) => [...prev, problem]);
    }
  };

  const handleRemoveProblem = (id: string) => {
    setSelectedProblems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Cadastro Médico do Gato</Text>

        <Text style={styles.label}>Nome do Proprietário</Text>
        <Controller
          control={control}
          name="ownerName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.ownerName && styles.errorInput]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Digite o nome do proprietário"
              placeholderTextColor="#999"
            />
          )}
        />
        {errors.ownerName && (
          <Text style={styles.errorText}>{errors.ownerName.message}</Text>
        )}

        <Text style={styles.label}>Nome do Gato</Text>
        <Controller
          control={control}
          name="catName"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.catName && styles.errorInput]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Digite o nome do gato"
              placeholderTextColor="#999"
            />
          )}
        />
        {errors.catName && (
          <Text style={styles.errorText}>{errors.catName.message}</Text>
        )}

        <Text style={styles.label}>Data do Atendimento</Text>
        <Controller
          control={control}
          name="appointmentDate"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, errors.appointmentDate && styles.errorInput]}
              value={value}
              placeholder="dd/mm/aaaa"
              placeholderTextColor="#999"
              maxLength={10}
              keyboardType="default"
              onChangeText={(text) => {
                const formattedText = text
                  .replace(/\D/g, '')
                  .replace(/(\d{2})(\d)/, '$1/$2')
                  .replace(/(\d{2})(\d)/, '$1/$2')
                  .replace(/(\d{4})(\d)/, '$1');
                onChange(formattedText);
              }}
            />
          )}
        />
        {errors.appointmentDate && (
          <Text style={styles.errorText}>{errors.appointmentDate.message}</Text>
        )}

        <Text style={styles.label}>Problemas Médicos</Text>
        <View style={styles.dropdownContainer}>
          {medicalProblemsList.map((problem) => (
            <TouchableOpacity
              key={problem.id}
              onPress={() => handleAddProblem(problem.id)}
              style={styles.dropdownItem}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#374224"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.dropdownText}>{problem.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedProblems.length > 0 && (
          <View style={styles.selectedProblemsContainer}>
            {selectedProblems.map((problem) => (
              <View key={problem.id} style={styles.selectedProblem}>
                <Text style={styles.selectedProblemText}>{problem.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveProblem(problem.id)}>
                  <Ionicons name="close-circle" size={24} color="#BF2F2F" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.label}>Detalhes Médicos</Text>
        <Controller
          control={control}
          name="medicalDetails"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.textArea, errors.medicalDetails && styles.errorInput]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Detalhes do atendimento"
              placeholderTextColor="#999"
              multiline
            />
          )}
        />
        {errors.medicalDetails && (
          <Text style={styles.errorText}>{errors.medicalDetails.message}</Text>
        )}

        <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
          <Ionicons name="camera" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.photoButtonText}>Capturar Foto do Gato</Text>
        </TouchableOpacity>
        {photo && <Image source={photo} style={styles.photoPreview} />}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit(onSubmit)}>
          <Ionicons name="save" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.submitButtonText}>Salvar Cadastro</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B6E388',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 50,
  },
  title: {
    fontSize: 20,
    color: '#374224',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374224',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#374224',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#374224',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  errorInput: {
    borderColor: '#BF2F2F',
  },
  errorText: {
    fontSize: 14,
    color: '#BF2F2F',
    marginBottom: 12,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#374224',
    borderRadius: 8,
    backgroundColor: '#F9FFEF',
    paddingVertical: 8,
    marginBottom: 12,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  selectedProblemsContainer: {
    marginBottom: 12,
    backgroundColor: '#F9FFEF',
    borderWidth: 1,
    borderColor: '#374224',
    borderRadius: 8,
    padding: 8,
  },
  selectedProblem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedProblemText: {
    fontSize: 16,
    color: '#333',
  },
  photoButton: {
    flexDirection: 'row',
    backgroundColor: '#4A9B3C',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoPreview: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginVertical: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#374224',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#2F8CBF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CatMedicalForm;
