import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InteractionRequest } from './schemas/request.schema';
import { RequestGateway } from './request.gateway';
import { RequestCreateI } from './request.types';

@Injectable()
export class RequestService {
  // private readonly validTransitions: Record<RequestStatus, RequestStatus[]> = {
  //   [RequestStatus.PENDING]: [
  //     RequestStatus.APPROVED,
  //     RequestStatus.REJECTED,
  //     RequestStatus.CANCELLED,
  //   ],
  //   [RequestStatus.APPROVED]: [],
  //   [RequestStatus.REJECTED]: [],
  //   [RequestStatus.CANCELLED]: [],
  // };

  constructor(
    @InjectModel(InteractionRequest.name)
    private readonly requestModel: Model<InteractionRequest>,
    private readonly requestGateway: RequestGateway,
  ) {}

  async createRequest(
    sender: string,
    request: RequestCreateI,
  ): Promise<InteractionRequest> {
    if (sender === request.receiver)
      throw new BadRequestException('Cannot send request to yourself');

    const createdRequest = await this.requestModel.create({
      ...request,
      receiver: new Types.ObjectId(request.receiver),
      targetId: new Types.ObjectId(request.targetId),
      sender: new Types.ObjectId(sender),
    });

    this.requestGateway.sendNewRequest(
      createdRequest.receiver.toString(),
      createdRequest,
    );

    return createdRequest;
  }

  // async updateRequestStatus(
  //   requestId: string,
  //   responderId: string,
  //   dto: UpdateRequestStatusDto,
  // ): Promise<IRequestResponse> {
  //   const request = await this.requestModel.findById(requestId);

  //   if (!request) {
  //     throw new NotFoundException(`Request ${requestId} not found`);
  //   }

  //   // Verify receiver is updating the status
  //   if (request.receiver.toString() !== responderId) {
  //     throw new BadRequestException('Only receiver can approve/reject');
  //   }

  //   // Check if current status allows transition
  //   const currentStatus = request.status;
  //   const allowedTransitions = this.validTransitions[currentStatus];

  //   if (!allowedTransitions.includes(dto.status)) {
  //     throw new BadRequestException(
  //       `Cannot transition from ${currentStatus} to ${dto.status}`,
  //     );
  //   }

  //   // Update status
  //   request.status = dto.status;
  //   request.responseAt = new Date();
  //   request.updatedAt = new Date();

  //   const updated = await request.save();
  //   const response = this.formatResponse(updated);

  //   // Send WebSocket notification to sender
  //   this.sendStatusUpdateNotification(response);

  //   return response;
  // }

  // async cancelRequest(
  //   requestId: string,
  //   senderId: string,
  // ): Promise<IRequestResponse> {
  //   const request = await this.requestModel.findById(requestId);

  //   if (!request) {
  //     throw new NotFoundException(`Request ${requestId} not found`);
  //   }

  //   // Verify sender is cancelling the request
  //   if (request.sender.toString() !== senderId) {
  //     throw new BadRequestException('Only sender can cancel');
  //   }

  //   // Check if request is still pending
  //   if (request.status !== RequestStatus.PENDING) {
  //     throw new BadRequestException(
  //       `Cannot cancel request with status ${request.status}`,
  //     );
  //   }

  //   request.status = RequestStatus.CANCELLED;
  //   request.responseAt = new Date();
  //   request.updatedAt = new Date();

  //   const updated = await request.save();
  //   const response = this.formatResponse(updated);

  //   this.requestGateway.sendNewRequest(response);

  //   return response;
  // }

  // async getReceiverRequests(
  //   receiverId: string,
  //   status?: RequestStatus,
  //   page: number = 1,
  //   limit: number = 10,
  // ): Promise<{ data: IRequestResponse[]; total: number }> {
  //   const query: any = {
  //     receiver: new Types.ObjectId(receiverId),
  //   };

  //   if (status) {
  //     query.status = status;
  //   }

  //   const total = await this.requestModel.countDocuments(query);
  //   const data = await this.requestModel
  //     .find(query)
  //     .sort({ createdAt: -1 })
  //     .skip((page - 1) * limit)
  //     .limit(limit);

  //   return {
  //     data: data.map((req) => this.formatResponse(req)),
  //     total,
  //   };
  // }

  // async getSenderRequests(
  //   senderId: string,
  //   status?: RequestStatus,
  //   page: number = 1,
  //   limit: number = 10,
  // ): Promise<{ data: IRequestResponse[]; total: number }> {
  //   const query: any = {
  //     sender: new Types.ObjectId(senderId),
  //   };

  //   if (status) {
  //     query.status = status;
  //   }

  //   const total = await this.requestModel.countDocuments(query);
  //   const data = await this.requestModel
  //     .find(query)
  //     .sort({ createdAt: -1 })
  //     .skip((page - 1) * limit)
  //     .limit(limit);

  //   return {
  //     data: data.map((req) => this.formatResponse(req)),
  //     total,
  //   };
  // }

  // async getRequestById(requestId: string): Promise<IRequestResponse> {
  //   const request = await this.requestModel.findById(requestId);

  //   if (!request) {
  //     throw new NotFoundException(`Request ${requestId} not found`);
  //   }

  //   return this.formatResponse(request);
  // }

  // async getTargetRequests(
  //   targetId: string,
  //   targetType: RequestType,
  // ): Promise<IRequestResponse[]> {
  //   const requests = await this.requestModel.find({
  //     target: new Types.ObjectId(targetId),
  //     targetType,
  //   });

  //   return requests.map((req) => this.formatResponse(req));
  // }

  // private formatResponse(doc: InteractionRequest): IRequestResponse {
  //   return {
  //     _id: doc._id.toString(),
  //     sender: doc.sender.toString(),
  //     receiver: doc.receiver.toString(),
  //     type: doc.type,
  //     targetId: doc.target.toString(),
  //     targetType: doc.targetType,
  //     status: doc.status,
  //     responseAt: doc.responseAt,
  //     metadata: doc.metadata,
  //     createdAt: doc.createdAt,
  //     updatedAt: doc.updatedAt,
  //   };
  // }

  // private sendNewRequestNotification(request: IRequestResponse) {
  //   const payload: IWebSocketRequestEvent = {
  //     requestId: request._id,
  //     sender: request.sender,
  //     receiver: request.receiver,
  //     type: request.type,
  //     targetId: request.targetId,
  //     targetType: request.targetType,
  //     status: request.status,
  //     metadata: request.metadata,
  //     timestamp: request.createdAt,
  //   };
  //   this.requestGateway.sendNewRequest(request.receiver, payload);
  // }

  // private sendStatusUpdateNotification(request: IRequestResponse) {
  //   const payload: IWebSocketRequestEvent = {
  //     requestId: request._id,
  //     sender: request.sender,
  //     receiver: request.receiver,
  //     type: request.type,
  //     targetId: request.targetId,
  //     targetType: request.targetType,
  //     status: request.status,
  //     metadata: request.metadata,
  //     timestamp: request.updatedAt,
  //   };
  //   this.requestGateway.sendStatusUpdate(request.sender, payload);
  // }

  // private sendCancellationNotification(request: IRequestResponse) {
  //   const payload: IWebSocketRequestEvent = {
  //     requestId: request._id,
  //     sender: request.sender,
  //     receiver: request.receiver,
  //     type: request.type,
  //     targetId: request.targetId,
  //     targetType: request.targetType,
  //     status: request.status,
  //     metadata: request.metadata,
  //     timestamp: request.updatedAt,
  //   };
  //   this.requestGateway.sendRequestCancelled(payload);
  // }
}
