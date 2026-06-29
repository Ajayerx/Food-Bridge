import React, {useState} from 'react';
import {View, Text, ScrollView, Alert} from 'react-native';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@/theme/ThemeProvider';
import {Button} from '@/components/ui/Button';
import {Card} from '@/components/ui/Card';
import {StatusBadge} from '@/components/StatusBadge';
import {TaskStatusTimeline} from '@/components/TaskStatusTimeline';
import {taskApi} from '@/api/task.api';
import type {Task, OrderStatus} from '@/types/order.types';

interface TaskDetailScreenProps {
  route: {params: {taskId: string; task: Task}};
  navigation: any;
}

export const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const {task: initialTask} = route.params;
  const {colors, spacing, typography, borderRadius: br} = useTheme();
  const insets = useSafeAreaInsets();
  const [task, setTask] = useState<Task>(initialTask);
  const [isUpdating, setIsUpdating] = useState(false);

  const order = task.order;

  const region = {
    latitude: (order.restaurantLatitude + order.deliveryLatitude) / 2,
    longitude: (order.restaurantLongitude + order.deliveryLongitude) / 2,
    latitudeDelta:
      Math.abs(order.restaurantLatitude - order.deliveryLatitude) * 1.5 + 0.02,
    longitudeDelta:
      Math.abs(order.restaurantLongitude - order.deliveryLongitude) * 1.5 + 0.02,
  };

  const handleUpdateStatus = async (status: OrderStatus) => {
    setIsUpdating(true);
    try {
      await taskApi.updateTaskStatus(task.id, status);

      const labelMap: Record<string, string> = {
        OutForDelivery: 'picked_upAt',
        Delivered: 'deliveredAt',
        DeliveryFailed: 'failedAt',
      };

      const updatedTask = {...task};
      if (labelMap[status] === 'picked_upAt') {
        updatedTask.status = 'PickedUp' as any;
        updatedTask.pickedUpAt = new Date().toISOString();
      } else if (status === 'Delivered') {
        updatedTask.status = 'Delivered' as any;
        updatedTask.deliveredAt = new Date().toISOString();
      } else if (status === 'DeliveryFailed') {
        updatedTask.status = 'Failed' as any;
        updatedTask.failedAt = new Date().toISOString();
      }

      setTask(updatedTask);

      if (status === 'Delivered' || status === 'DeliveryFailed') {
        Alert.alert(
          status === 'Delivered' ? 'Delivered!' : 'Marked as Failed',
          status === 'Delivered'
            ? 'The delivery has been completed successfully.'
            : 'The delivery has been marked as failed.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      }
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.error?.message ?? 'Failed to update status.',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const canPickUp =
    task.status === 'Assigned' || task.status === 'PickedUp';
  const canDeliver = task.status === 'PickedUp';

  return (
    <ScrollView
      style={{flex: 1, backgroundColor: colors.background}}
      contentContainerStyle={{
        paddingBottom: insets.bottom + spacing.xxl,
      }}>
      {/* Map */}
      <View style={{height: 240}}>
        <MapView
          style={{flex: 1}}
          initialRegion={region}
          provider={PROVIDER_GOOGLE}>
          <Marker
            coordinate={{
              latitude: order.restaurantLatitude,
              longitude: order.restaurantLongitude,
            }}
            title={order.restaurantName}
            description="Pickup"
            pinColor={colors.primary}
          />
          <Marker
            coordinate={{
              latitude: order.deliveryLatitude,
              longitude: order.deliveryLongitude,
            }}
            title={order.customerName}
            description="Delivery"
            pinColor={colors.success}
          />
          <Polyline
            coordinates={[
              {
                latitude: order.restaurantLatitude,
                longitude: order.restaurantLongitude,
              },
              {
                latitude: order.deliveryLatitude,
                longitude: order.deliveryLongitude,
              },
            ]}
            strokeColor={colors.primary}
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        </MapView>
      </View>

      {/* Content */}
      <View style={{padding: spacing.lg}}>
        {/* Order header */}
        <Card padded style={{marginBottom: spacing.lg}}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}>
            <View>
              <Text
                style={[
                  typography.h3,
                  {color: colors.textPrimary},
                ]}>
                #{order.orderCode}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: colors.textSecondary,
                  marginTop: spacing.xxs,
                }}>
                {order.restaurantName}
              </Text>
            </View>
            <StatusBadge status={task.status} />
          </View>

          <View style={{gap: spacing.sm}}>
            <View style={{flexDirection: 'row', gap: spacing.sm}}>
              <Text style={{fontSize: 12, color: colors.textSecondary}}>
                📍 From:
              </Text>
              <Text
                style={{fontSize: 12, color: colors.textPrimary, flex: 1}}>
                {order.restaurantAddress}
              </Text>
            </View>
            <View style={{flexDirection: 'row', gap: spacing.sm}}>
              <Text style={{fontSize: 12, color: colors.textSecondary}}>
                📍 To:
              </Text>
              <Text
                style={{fontSize: 12, color: colors.textPrimary, flex: 1}}>
                {order.deliveryAddress}
              </Text>
            </View>
            <View style={{flexDirection: 'row', gap: spacing.sm}}>
              <Text style={{fontSize: 12, color: colors.textSecondary}}>
                👤 Customer:
              </Text>
              <Text
                style={{fontSize: 12, color: colors.textPrimary, flex: 1}}>
                {order.customerName}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: spacing.lg,
              marginTop: spacing.md,
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
                }}>
                Distance
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.primary,
                  marginTop: spacing.xxs,
                }}>
                {task.distanceKm.toFixed(1)} km
              </Text>
            </View>
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                }}>
                Earnings
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.success,
                  marginTop: spacing.xxs,
                }}>
                ₹{order.agentEarnings.toFixed(0)}
              </Text>
            </View>
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                }}>
                Total
              </Text>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: colors.textPrimary,
                  marginTop: spacing.xxs,
                }}>
                ₹{order.totalAmount.toFixed(0)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Timeline */}
        <Card padded style={{marginBottom: spacing.lg}}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: colors.textPrimary,
              marginBottom: spacing.lg,
            }}>
            Status Timeline
          </Text>
          <TaskStatusTimeline task={task} />
        </Card>

        {/* Action buttons */}
        <View style={{gap: spacing.md}}>
          {task.status === 'Assigned' && (
            <Button
              title="📦 Mark as Picked Up"
              onPress={() => handleUpdateStatus('OutForDelivery' as OrderStatus)}
              loading={isUpdating}
              variant="primary"
              size="lg"
            />
          )}
          {canDeliver && (
            <>
              <Button
                title="✅ Mark as Delivered"
                onPress={() => handleUpdateStatus('Delivered' as OrderStatus)}
                loading={isUpdating}
                variant="primary"
                size="lg"
              />
              <Button
                title="❌ Delivery Failed"
                onPress={() =>
                  handleUpdateStatus('DeliveryFailed' as OrderStatus)
                }
                loading={isUpdating}
                variant="danger"
                size="lg"
              />
            </>
          )}
          {(task.status === 'Delivered' || task.status === 'Failed') && (
            <View
              style={{
                backgroundColor: colors.surfaceVariant,
                padding: spacing.lg,
                borderRadius: br.md,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: colors.textSecondary,
                }}>
                {task.status === 'Delivered'
                  ? '✅ Delivery Completed'
                  : '❌ Delivery Failed'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
