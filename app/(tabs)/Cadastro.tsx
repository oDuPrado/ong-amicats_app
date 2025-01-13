import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
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
    .default([]), // Garante que o valor padrão seja um array vazio
  medicalDetails: yup.string().required('Detalhes médicos são obrigatórios'),
});

const CatMedicalForm = () => {
  const [photo, setPhoto] = useState<{ uri: string } | null>(null);
  const [selectedProblems, setSelectedProblems] = useState<
    { id: string; name: string }[]
  >([]);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      ownerName: '',
      catName: '',
      appointmentDate: '',
      medicalProblems: [],
      medicalDetails: '',
    },
  });

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
      const cadasterId = 'd5f5416c-7d6f-4a43-ac5c-015669cd2f4f'; // Substitua por um ID fixo ou dinâmico
      const catId = uuidv4(); // ID único para o gato
      const submissionData = { ...data, medicalProblems: selectedProblems, photo };
  
      console.log('Iniciando cadastro no Firebase...');
      console.log('Dados:', submissionData);
  
      // Referência à subcoleção 'Cats' dentro do 'Cadaster'
      const catRef = doc(db, 'Cadaster', cadasterId, 'Cats', catId);
  
      // Salvando os dados do gato na subcoleção 'Cats'
      await setDoc(catRef, submissionData);
  
      console.log('Cadastro salvo com sucesso no Firebase!');
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
    <ScrollView contentContainerStyle={styles.container}>
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
            maxLength={10}
            keyboardType="default"
            onChangeText={(text) => {
              let formattedText = text
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
      <View style={styles.dropdown}>
        {medicalProblemsList.map((problem) => (
          <TouchableOpacity
            key={problem.id}
            onPress={() => handleAddProblem(problem.id)}
            style={styles.dropdownItem}
          >
            <Text>{problem.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View>
        {selectedProblems.map((problem) => (
          <View key={problem.id} style={styles.selectedProblem}>
            <Text>{problem.name}</Text>
            <TouchableOpacity onPress={() => handleRemoveProblem(problem.id)}>
              <Text style={styles.removeText}>Remover</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

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
            multiline
          />
        )}
      />
      {errors.medicalDetails && (
        <Text style={styles.errorText}>{errors.medicalDetails.message}</Text>
      )}

      <Button title="Capturar Foto do Gato" onPress={handleTakePhoto} />
      {photo && <Image source={photo} style={styles.photo} />}

      <Button title="Salvar Cadastro" onPress={handleSubmit(onSubmit)} />
    </ScrollView>
  );
};

export default CatMedicalForm;


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#DFFFE2', // Fundo verde claro
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FFF',
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#FFF',
    fontSize: 16,
    color: '#333',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  errorInput: {
    borderColor: '#E3350D',
  },
  errorText: {
    fontSize: 14,
    color: '#E3350D',
    marginBottom: 12,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    backgroundColor: '#FFF',
    paddingVertical: 8,
    marginBottom: 12,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  selectedProblem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9', // Fundo verde claro
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeText: {
    color: '#E3350D',
    fontWeight: 'bold',
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginVertical: 16,
    alignSelf: 'center',
  },
});
