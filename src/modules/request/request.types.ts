import { RequestTargetType } from './schemas/request.schema';

export interface IRequestStatusBadge {
  label: string;
  variant: string;
  color: string;
}

export interface IRequestTag {
  label: string;
  variant: string;
}

export interface IRequestJourneyStep {
  _id?: string;
  title: string;
  description: string;
  timestamp?: string;
  status: string;
  icon: string;
}

export interface RequestCreateI {
  recipient: string;
  receiver: string;
  target: string;
  targetType: RequestTargetType;
  statusBadge: IRequestStatusBadge;
  tags: IRequestTag[];
  description: string;
  timestamp?: string;
  investmentAmount?: string;
  journeySteps: IRequestJourneyStep[];
  insight?: string;
  highlighted?: boolean;
}

export interface IWebSocketRequestEvent {
  request: string;
  recipient: string;
  receiver: string;
  target: string;
  targetType: RequestTargetType;
  status: string;
  timestamp?: Date;
}

export interface ICreateRequestPayload extends RequestCreateI {}

export interface IUpdateRequestPayload {
  status: string;
  userId: string;
}

export interface IRequestResponse extends RequestCreateI {
  _id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
