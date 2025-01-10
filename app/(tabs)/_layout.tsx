import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons"; // Biblioteca de ícones
import HomeScreen from "./home";
import GatosScreen from "./Gatos";
import CadastroScreen from "./Cadastro";
import CalendarioScreen from "./Calendario";

const Drawer = createDrawerNavigator();

function DrawerLayout() {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerStyle: {
          backgroundColor: "#1E1E1E", // Fundo do menu
          paddingVertical: 20, // Espaçamento interno
        },
        drawerLabelStyle: {
          color: "#FFFFFF", // Cor do texto
          fontSize: 16, // Tamanho do texto
          marginLeft: -10, // Ajuste de alinhamento com o ícone
        },
        drawerActiveTintColor: "#E3350D", // Cor do texto da aba ativa
        drawerInactiveTintColor: "#FFFFFF", // Cor do texto das abas inativas
        drawerActiveBackgroundColor: "#292929", // Fundo da aba ativa
      }}
    >
      {/* Home */}
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          drawerIcon: ({ color }) => (
            <Ionicons name="home-outline" size={20} color={color} />
          ),
        }}
      />
      {/* Calendário */}
      <Drawer.Screen
        name="Calendario"
        component={CalendarioScreen}
        options={{
          title: "Calendário",
          drawerIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={20} color={color} />
          ),
        }}
      />
      {/* Gatos */}
      <Drawer.Screen
        name="Gatos"
        component={GatosScreen}
        options={{
          title: "Gatos",
          drawerIcon: ({ color }) => (
            <Ionicons name="paw-outline" size={20} color={color} />
          ),
        }}
      />
      {/* Cadastro */}
      <Drawer.Screen
        name="Cadastro"
        component={CadastroScreen}
        options={{
          title: "Cadastro",
          drawerIcon: ({ color }) => (
            <Ionicons name="add-circle-outline" size={20} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
}

export default DrawerLayout;
