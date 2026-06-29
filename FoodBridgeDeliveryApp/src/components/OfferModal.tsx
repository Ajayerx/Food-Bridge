import React, {useCallback} from 'react';
import {View, Text, Modal, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {useDispatchOffer} from '@/hooks/useDispatchOffer';
import {OfferCountdown} from './OfferCountdown';
import {OfferInfo} from './OfferInfo';
import {OfferActionButtons} from './OfferActionButtons';

export const OfferModal: React.FC = () => {
  const {
    currentOffer,
    isAccepting,
    isRejecting,
    acceptOffer,
    rejectOffer,
    dismissOffer,
  } = useDispatchOffer();
  const {colors, spacing} = useTheme();
  const insets = useSafeAreaInsets();

  const handleExpire = useCallback(() => {
    dismissOffer();
  }, [dismissOffer]);

  if (!currentOffer) {
    return null;
  }

  return (
    <Modal
      visible={!!currentOffer}
      transparent
      animationType="slide"
      onRequestClose={dismissOffer}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-end',
        }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: insets.bottom + spacing.lg,
            paddingTop: spacing.xxl,
            paddingHorizontal: spacing.xl,
            maxHeight: '80%',
          }}>
          {/* Drag indicator */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              alignSelf: 'center',
              marginBottom: spacing.xl,
            }}
          />

          {/* Header */}
          <View style={{marginBottom: spacing.xl}}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '700',
                  color: colors.textPrimary,
                }}>
                New Delivery
              </Text>
              <View
                style={{
                  backgroundColor: colors.primaryLight + '20',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: 8,
                }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.primary,
                  }}>
                  #{currentOffer.orderCode}
                </Text>
              </View>
            </View>

            <OfferCountdown
              expiresAt={currentOffer.expiresAt}
              onExpire={handleExpire}
              style={{marginTop: spacing.lg}}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{flexGrow: 0}}>
            <OfferInfo offer={currentOffer} />

            <OfferActionButtons
              onAccept={acceptOffer}
              onDecline={rejectOffer}
              isAccepting={isAccepting}
              isRejecting={isRejecting}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
