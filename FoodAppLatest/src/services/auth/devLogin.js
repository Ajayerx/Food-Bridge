import AsyncStorage from "@react-native-async-storage/async-storage";

export const devLogin = async () => {

    const demoUser = {
        _id: "64f000000000000000000001",
        name: "Demo User",
        phone: "9999999999",
        email: "demo@foodapp.com"
    };

    const demoToken = "demo-dev-token";
    await AsyncStorage.setItem("token", demoToken);
    await AsyncStorage.setItem("user", JSON.stringify(demoUser));

    // 🔥 IMPORTANT: update Zustand also
    useUserStore.getState().setUser(demoUser);

    console.log("🔥 DEMO LOGIN SUCCESS");
    return {
        token: demoToken,
        user: demoUser
    };
};