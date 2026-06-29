import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {Avatar} from '@/components/ui/Avatar';
import {Card} from '@/components/ui/Card';
import {MenuItem} from '@/components/MenuItem';
import {StatsRow} from '@/components/StatsRow';
import {useAuthStore} from '@/stores/auth.store';
import {useAgentStore} from '@/stores/agent.store';
import {agentApi} from '@/api/agent.api';
import type {DeliveryAgent} from '@/types/agent.types';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation}) => {
  const {colors, spacing, typography} = useTheme();
  const insets = useSafeAreaInsets();
  const fullName = useAuthStore(s => s.fullName) ?? 'Agent';
  const mobileNumber = useAuthStore(s => s.mobileNumber) ?? '';
  const totalEarnings = useAgentStore(s => s.totalEarnings);
  const totalDeliveries = useAgentStore(s => s.totalDeliveries);

  const [profile, setProfile] = useState<DeliveryAgent | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await agentApi.getProfile();
        if (res.data?.data) {
          setProfile(res.data.data as DeliveryAgent);
        }
      } catch {
        // silently fail
      }
    };
    fetchProfile();
  }, []);

  const vehicleType = profile?.vehicleType ?? '—';
  const vehicleNumber = profile?.vehicleNumber ?? '—';
  const licenseNumber = profile?.licenseNumber ?? '—';

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: colors.background}}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.xxxl,
        paddingBottom: insets.bottom + spacing.xxl,
        paddingHorizontal: spacing.lg,
      }}>
      {/* Avatar + Name */}
      <View style={{alignItems: 'center', marginBottom: spacing.xxl}}>
        <Avatar name={fullName} size={72} style={{marginBottom: spacing.md}} />
        <Text
          style={[
            typography.h3,
            {color: colors.textPrimary, marginBottom: spacing.xxs},
          ]}>
          {fullName}
        </Text>
        <Text style={{fontSize: 14, color: colors.textSecondary}}>
          {mobileNumber}
        </Text>
      </View>

      {/* Stats */}
      <View style={{marginBottom: spacing.lg}}>
        <StatsRow
          totalDeliveries={totalDeliveries}
          totalEarnings={totalEarnings}
          averageRating={4.8}
        />
      </View>

      {/* Vehicle Info */}
      <Card padded style={{marginBottom: spacing.lg}}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: spacing.md,
          }}>
          Vehicle Information
        </Text>
        <View style={{gap: spacing.md}}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={{fontSize: 14, color: colors.textSecondary}}>
              Type
            </Text>
            <Text
              style={{fontSize: 14, fontWeight: '600', color: colors.textPrimary}}>
              {vehicleType}
            </Text>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: colors.borderLight,
            }}
          />
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={{fontSize: 14, color: colors.textSecondary}}>
              Vehicle Number
            </Text>
            <Text
              style={{fontSize: 14, fontWeight: '600', color: colors.textPrimary}}>
              {vehicleNumber}
            </Text>
          </View>
          <View
            style={{
              height: 1,
              backgroundColor: colors.borderLight,
            }}
          />
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <Text style={{fontSize: 14, color: colors.textSecondary}}>
              License Number
            </Text>
            <Text
              style={{fontSize: 14, fontWeight: '600', color: colors.textPrimary}}>
              {licenseNumber || '—'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Menu */}
      <Card padded={false}>
        <MenuItem
          icon={<Text style={{fontSize: 18}}>⚙️</Text>}
          label="Settings"
          onPress={() => navigation.navigate('Settings')}
        />
      </Card>
    </ScrollView>
  );
};
