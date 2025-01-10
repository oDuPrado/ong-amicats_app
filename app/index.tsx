import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebaseConfig";

export default function IndexScreen() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Observa o estado de autenticação do usuário
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            console.log("Usuário autenticado:", user.email); // Log para depuração
            router.replace("/(tabs)/home"); // Redireciona para as abas principais
          } else {
            console.log("Usuário não autenticado, redirecionando para login");
            router.replace("/(auth)/login"); // Redireciona para a página de login
          }
        });

        setIsChecking(false); // Finaliza a checagem
        return () => unsubscribe(); // Remove o listener ao desmontar
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsChecking(false); // Finaliza mesmo em caso de erro
      }
    };

    checkAuthState();
  }, [router]);

  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#1E1E1E" }}>
        <ActivityIndicator size="large" color="#E3350D" />
      </View>
    );
  }

  return null; // Caso o estado seja resolvido, já terá redirecionado
}
