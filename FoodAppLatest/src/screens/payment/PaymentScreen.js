import React from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Colors } from "../../constants/colors";
import { useOrderStore } from "../../store/orderStore";

const PaymentScreen = ({ navigation }) => {

    const { paymentMethods } = useOrderStore();

    const selectPayment = method => {

        navigation.navigate({
            name: "CheckoutScreen",
            params: { paymentMethod: method },
            merge: true
        });

    };

    return (
        <View style={styles.container}>

            <FlatList
                data={paymentMethods}
                keyExtractor={item => item.category}
                renderItem={({ item }) => (
                    <View>

                        <Text style={styles.category}>
                            {item.category}
                        </Text>

                        {item.methods.map(method => (
                            <TouchableOpacity
                                key={method.id}
                                style={styles.card}
                                onPress={() => selectPayment(method)}
                            >
                                <Icon
                                    name={method.icon}
                                    size={20}
                                    color={Colors.primary}
                                />

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.title}>
                                        {method.label}
                                    </Text>

                                    <Text style={styles.subtitle}>
                                        {method.subtitle}
                                    </Text>
                                </View>

                            </TouchableOpacity>
                        ))}

                    </View>
                )}
            />

        </View>
    );

};

export default PaymentScreen;
const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 16
    },

    category: {
        fontSize: 13,
        fontWeight: "700",
        marginTop: 20,
        marginBottom: 8,
        color: Colors.textLight
    },

    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        borderRadius: 12,
        backgroundColor: Colors.white,
        marginBottom: 10,
        gap: 10
    },

    title: {
        fontSize: 15,
        fontWeight: "600"
    },

    subtitle: {
        fontSize: 12,
        color: Colors.textLight
    }

});