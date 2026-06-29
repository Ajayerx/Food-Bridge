import type {NavigatorScreenParams} from '@react-navigation/native';
import type {DispatchOffer} from './dispatch.types';
import type {Task} from './order.types';

export type AuthStackParamList = {
  Registration: undefined;
  AwaitingApproval: undefined;
  Login: undefined;
  OtpVerification: {mobileNumber: string};
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks: undefined;
  Profile: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  AwaitingApproval: undefined;
  Suspended: undefined;
  Rejected: undefined;
  Banned: undefined;
  OfferModal: {offer: DispatchOffer};
};

export type TaskStackParamList = {
  TaskList: undefined;
  TaskDetail: {taskId: string; task: Task};
};
