import React from 'react';
import {View, Text} from 'react-native';
import {useTheme} from '@/theme/ThemeProvider';
import type {DispatchOffer} from '@/types/dispatch.types';

interface OfferInfoProps {
  offer: DispatchOffer;
}

export const OfferInfo: React.FC<OfferInfoProps> = ({offer}) => {
  const {colors, spacing, typography} = useTheme();

  const infoRows = [
    {label: 'From', value: offer.restaurantName, sub: offer.restaurantAddress},
    {label: 'To', value: offer.deliveryAddress},
    {label: 'Customer', value: offer.customerName},
  ];

  return (
    <View style={{gap: spacing.md}}>
      {infoRows.map((row, idx) => (
        <View key={idx}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: spacing.xxs,
            }}>
            {row.label}
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.textPrimary,
            }}>
            {row.value}
          </Text>
          {row.sub && (
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: spacing.xxs,
              }}>
              {row.sub}
            </Text>
          )}
        </View>
      ))}

      <View
        style={{
          flexDirection: 'row',
          gap: spacing.lg,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        }}>
        <View style={{flex: 1}}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>
            Distance
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.primary,
              marginTop: spacing.xxs,
            }}>
            {offer.distanceKm.toFixed(1)} km
          </Text>
        </View>
        <View style={{flex: 1}}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              color: colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>
            Earnings
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: colors.success,
              marginTop: spacing.xxs,
            }}>
            ₹{offer.earnings.toFixed(0)}
          </Text>
        </View>
      </View>
    </View>
  );
};
