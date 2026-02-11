export interface RequestCreateI {
  receiver: string;
  targetId: string;
  targetType: string;
  metadata?: Record<string, any>;
}

export interface IWebSocketRequestEvent {
  request: string;
  sender: string;
  receiver: string;
  type: RequestType;
  target: string;
  targetType: RequestType;
  status: RequestStatus;
  timestamp: Date;
}

import { RequestStatus, RequestType } from './schemas/request.schema';

export interface ICreateRequestPayload {
  sender: string;
  receiver: string;
  type: RequestType;
  targetId: string;
  targetType: RequestType;
  metadata?: Record<string, any>;
}

export interface IUpdateRequestPayload {
  status: RequestStatus;
  responderId: string;
}

export interface IRequestResponse {
  _id: string;
  sender: string;
  receiver: string;
  type: RequestType;
  targetId: string;
  targetType: RequestType;
  status: RequestStatus;
  responseAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
