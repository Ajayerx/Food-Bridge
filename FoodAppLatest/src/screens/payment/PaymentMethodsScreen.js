import { useFocusEffect } from "@react-navigation/native";
import React, { useState, useCallback } from "react";
import axios from "axios";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const PaymentMethodsScreen = ({ navigation }) => {

    const [cards, setCards] = useState([]);
    const fetchCards = async () => {

        try {

            const res = await axios.get("http://10.0.2.2:5000/api/cards");

            setCards(res.data);

        } catch (err) {

            console.log("FETCH CARDS ERROR:", err.message);

        }

    };
    useFocusEffect(
        useCallback(() => {

            fetchCards();

        }, [])
    );
    const Row = ({ icon, title, action }) => (
        <TouchableOpacity style={styles.row}>
            <View style={styles.rowLeft}>
                <Icon name={icon} size={24} color="#444" />
                <Text style={styles.rowText}>{title}</Text>
            </View>

            <Text style={styles.actionText}>{action}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>

            {/* Header */}

            <View style={styles.header}>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={26} color="#000" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>PAYMENTS</Text>

            </View>

            <ScrollView>

                {/* UPI */}

                <Text style={styles.section}>UPI</Text>

                <Row
                    icon="account-balance-wallet"
                    title="Gpay UPI"
                    action="MANAGE"
                />

                {/* Saved Cards */}

                <Text style={styles.section}>SAVED CARDS</Text>

                <TouchableOpacity
                    style={styles.addCard}
                    onPress={() => navigation.navigate("AddCard")}
                >

                    <View style={styles.addIcon}>
                        <Icon name="add" size={20} color="#FF6D00" />
                    </View>

                    <Text style={styles.addText}>ADD NEW CARD</Text>

                </TouchableOpacity>
                {cards.map((card) => {

                    const last4 = card.cardNumber.slice(-4);

                    return (
                        <View key={card._id} style={styles.cardItem}>

                            <Text style={styles.cardText}>
                                {card.brand} **** {last4}
                            </Text>

                        </View>
                    );

                })}
                {/* Wallet */}

                <Text style={styles.section}>WALLET</Text>

                <Row
                    icon="account-balance-wallet"
                    title="Mobikwik"
                    action="LINK ACCOUNT"
                />

                <Row
                    icon="account-balance-wallet"
                    title="PhonePe"
                    action="LINK ACCOUNT"
                />

                <Row
                    icon="account-balance-wallet"
                    title="Amazon Pay"
                    action="LINK ACCOUNT"
                />

                {/* Corporate Wallet */}

                <Text style={styles.section}>CORPORATE WALLETS</Text>

                <Row
                    icon="business"
                    title="Bill To Company"
                    action="LINK ACCOUNT"
                />

                <View style={{ height: 40 }} />

            </ScrollView>

        </View>
    );
};

export default PaymentMethodsScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F5F5F5"
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderColor: "#eee"
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginLeft: 16
    },

    section: {
        marginTop: 20,
        marginBottom: 8,
        paddingHorizontal: 16,
        fontWeight: "600",
        color: "#777"
    },

    row: {
        backgroundColor: "#fff",
        padding: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: "#eee"
    },

    rowLeft: {
        flexDirection: "row",
        alignItems: "center"
    },

    rowText: {
        marginLeft: 12,
        fontSize: 16
    },

    actionText: {
        color: "#FF6D00",
        fontWeight: "600"
    },

    addCard: {
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        padding: 16
    },

    addIcon: {
        borderWidth: 1,
        borderColor: "#FF6D00",
        padding: 4,
        marginRight: 10
    },

    addText: {
        color: "#FF6D00",
        fontWeight: "700",
        fontSize: 16
    },

    cardBrands: {
        flexDirection: "row",
        justifyContent: "space-around",
        backgroundColor: "#fff",
        paddingVertical: 12
    },

    brand: {
        color: "#888",
        fontWeight: "600"
    },

    cardItem: {
        backgroundColor: "#fff",
        padding: 16,
        borderBottomWidth: 1,
        borderColor: "#eee"
    },

    cardText: {
        fontSize: 16,
        fontWeight: "500"
    },

});