import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons"; // Biblioteca de ícones
import HomeScreen from "./home";
import GatosScreen from "./Gatos";
import CadastroScreen from "./Cadastro";

const Tab = createBottomTabNavigator();

function TabLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#1E1E1E", // Fundo do menu
          paddingVertical: 10, // Espaçamento interno
        },
        tabBarLabelStyle: {
          color: "#FFFFFF", // Cor do texto
          fontSize: 14, // Tamanho do texto
        },
        tabBarActiveTintColor: "#E3350D", // Cor do texto da aba ativa
        tabBarInactiveTintColor: "#FFFFFF", // Cor do texto das abas inativas
        tabBarActiveBackgroundColor: "#292929", // Fundo da aba ativa
        tabBarIconStyle: {
          marginBottom: -5, // Ajuste para alinhar ícones
        },
      }}
    >
      {/* Home */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={20} color={color} />
          ),
        }}
      />
      {/* Gatos */}
      <Tab.Screen
        name="Gatos"
        component={GatosScreen}
        options={{
          title: "Gatos",
          tabBarIcon: ({ color }) => (
            <Ionicons name="paw-outline" size={20} color={color} />
          ),
        }}
      />
      {/* Cadastro */}
      <Tab.Screen
        name="Cadastro"
        component={CadastroScreen}
        options={{
          title: "Cadastro",
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle-outline" size={20} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default TabLayout;
