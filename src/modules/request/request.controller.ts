import { Body, Controller, Post } from '@nestjs/common';
import { RequestService } from './request.service';
import { UserReal } from 'src/core/decorators/user.decorators';
import { RequestCreateDto } from './dtos/request.create.dto';
import { Auth } from 'src/core/decorators/auth.decorator';

@Controller({ path: 'request', version: '1' })
@Auth()
export class RequestController {
  constructor(private requestService: RequestService) {}

  @Post()
  async createRequest(
    @UserReal() user: UserReal,
    @Body() dto: RequestCreateDto,
  ) {
    return this.requestService.createRequest(user.user, dto);
  }

  // /**
  //  * Get requests received by the user
  //  * GET /requests/inbox
  //  */
  // @Get('inbox')
  // async getInboxRequests(
  //   @UserReal() user: UserReal,
  //   @Query() query: RequestQueryDto,
  // ) {
  //   const page = query.page ? parseInt(query.page.toString()) : 1;
  //   const limit = query.limit ? parseInt(query.limit.toString()) : 10;

  //   return this.requestService.getReceiverRequests(
  //     user.user,
  //     query.status,
  //     page,
  //     limit,
  //   );
  // }

  // /**
  //  * Get requests sent by the user
  //  * GET /requests/sent
  //  */
  // @Get('sent')
  // async getSentRequests(
  //   @UserReal() user: UserReal,
  //   @Query() query: RequestQueryDto,
  // ) {
  //   const page = query.page ? parseInt(query.page.toString()) : 1;
  //   const limit = query.limit ? parseInt(query.limit.toString()) : 10;

  //   return this.requestService.getSenderRequests(
  //     user.user,
  //     query.status,
  //     page,
  //     limit,
  //   );
  // }

  // /**
  //  * Get a specific request by ID
  //  * GET /requests/:requestId
  //  */
  // @Get(':requestId')
  // async getRequestById(@Param('requestId') requestId: string) {
  //   return this.requestService.getRequestById(requestId);
  // }

  // /**
  //  * Approve or reject a request
  //  * PATCH /requests/:requestId/respond
  //  */
  // @Patch(':requestId/respond')
  // async respondToRequest(
  //   @UserReal() user: UserReal,
  //   @Param('requestId') requestId: string,
  //   @Body() dto: UpdateRequestStatusDto,
  // ) {
  //   return this.requestService.updateRequestStatus(requestId, user.user, dto);
  // }

  // /**
  //  * Cancel a request (sender only)
  //  * DELETE /requests/:requestId
  //  */
  // @Delete(':requestId')
  // @HttpCode(200)
  // async cancelRequest(
  //   @UserReal() user: UserReal,
  //   @Param('requestId') requestId: string,
  // ) {
  //   return this.requestService.cancelRequest(requestId, user.user);
  // }
}
