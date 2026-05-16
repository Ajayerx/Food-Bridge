import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    Alert,
    ScrollView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../store/userStore';
import api from '../../services/api/base';

export const EditProfileScreen = ({ navigation }) => {
    const user = useUserStore(s => s.user);
    const setUser = useUserStore(s => s.setUser);

    const [name, setName] = useState(user?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profilePictureUrl, setProfilePictureUrl] = useState(user?.avatar_url || '');

    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name && !email && !profilePictureUrl) {
            Alert.alert('Validation', 'Please change at least one field');
            return;
        }

        setLoading(true);
        try {
            // ✅ FIXED: endpoint changed from /user/profile → PUT /me
            // ✅ FIXED: payload uses `profile_picture_url` not `avatar`, no `phone`
            const res = await api.put('/me', {
                full_name: name || undefined,   // UpdateProfileRequestDto.FullName → full_name
                email: email || undefined,
                avatar_url: profilePictureUrl || undefined, // UpdateProfileRequestDto.AvatarUrl → avatar_url
            });

            // Backend returns { success: true, data: { id, name, mobile_number, email, ... } }
            const updatedUser = res.data?.data;
            if (updatedUser) {
                const merged = {
                    ...user,                // user is already in scope from useUserStore
                    full_name: updatedUser.full_name,
                    email: updatedUser.email,
                    avatar_url: updatedUser.avatar_url,
                };
                setUser(merged);
            }

            Alert.alert('Success', 'Profile updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (e) {
            const msg = e?.response?.data?.error?.message || 'Failed to update profile';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const initials = name
        ?.split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Profile Avatar */}
                <View style={styles.avatarSection}>
                    {/* ✅ FIXED: `user.avatar` → `user.profile_picture_url` */}
                    {user?.avatar_url ? (
                        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Text style={styles.avatarText}>{initials || 'U'}</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.changePhotoBtn}>
                        <Icon name="photo-camera" size={18} color={Colors.white} />
                    </TouchableOpacity>
                </View>

                {/* Mobile Number — read-only, cannot be changed */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Mobile Number</Text>
                    <View style={[styles.input, styles.inputDisabled]}>
                        <Text style={styles.inputDisabledText}>
                            {user?.mobile_number || '—'}
                        </Text>
                        <Icon name="lock" size={16} color={Colors.textLight} />
                    </View>
                    <Text style={styles.hint}>Mobile number cannot be changed</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your name"
                        placeholderTextColor={Colors.textLight}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        placeholder="Enter your email"
                        placeholderTextColor={Colors.textLight}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Profile Picture URL</Text>
                    <TextInput
                        style={styles.input}
                        value={profilePictureUrl}
                        onChangeText={setProfilePictureUrl}
                        placeholder="https://..."
                        placeholderTextColor={Colors.textLight}
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                    {loading
                        ? <ActivityIndicator color={Colors.white} />
                        : <Text style={styles.saveText}>Save Changes</Text>
                    }
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { padding: 20 },
    avatarSection: { alignItems: 'center', marginBottom: 30 },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarFallback: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { fontSize: 32, color: Colors.white, fontWeight: 'bold' },
    changePhotoBtn: {
        position: 'absolute', bottom: 0, right: 130,
        backgroundColor: Colors.primary, padding: 8, borderRadius: 20,
    },
    formGroup: { marginBottom: 18 },
    label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6 },
    input: {
        backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
        borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 14, color: Colors.textPrimary,
    },
    inputDisabled: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: Colors.background,
    },
    inputDisabledText: { fontSize: 14, color: Colors.textSecondary },
    hint: { fontSize: 12, color: Colors.textLight, marginTop: 4 },
    saveBtn: {
        marginTop: 20, backgroundColor: Colors.primary,
        paddingVertical: 15, borderRadius: 12, alignItems: 'center',
    },
    saveText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});