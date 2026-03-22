import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequestService } from './request.service';
import { UserReal } from 'src/core/decorators/user.decorators';
import { RequestCreateDto } from './dtos/request.create.dto';
import { Auth } from 'src/core/decorators/auth.decorator';
import { RequestQueryDto } from './dtos/request.query.dto';
import {
  AddJourneyStepDto,
  OverwriteJourneyStepsDto,
  RequestUpdateDto,
  UpdateJourneyStepDto,
} from './dtos/request.update.dto';

@Controller({ path: 'request', version: '1' })
@Auth()
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get()
  getAllRequests(@UserReal() user: UserReal, @Query() query: RequestQueryDto) {
    return this.requestService.findAllForUser(user.user, query);
  }

  @Get(':id')
  getRequestById(@UserReal() user: UserReal, @Param('id') id: string) {
    return this.requestService.findByIdForUser(id, user.user);
  }

  @Post()
  createRequest(@Body() dto: RequestCreateDto) {
    return this.requestService.createRequest(dto);
  }

  @Patch(':id')
  updateRequest(
    @UserReal() user: UserReal,
    @Param('id') id: string,
    @Body() dto: RequestUpdateDto,
  ) {
    return this.requestService.updateForUser(id, user.user, dto);
  }

  @Delete(':id')
  deleteRequest(@UserReal() user: UserReal, @Param('id') id: string) {
    return this.requestService.deleteForUser(id, user.user);
  }

  @Post(':id/journey-steps')
  addJourneyStep(
    @UserReal() user: UserReal,
    @Param('id') id: string,
    @Body() dto: AddJourneyStepDto,
  ) {
    return this.requestService.addJourneyStep(id, user.user, dto);
  }

  @Patch(':id/journey-steps/:stepId')
  updateJourneyStep(
    @UserReal() user: UserReal,
    @Param('id') id: string,
    @Param('stepId') stepId: string,
    @Body() dto: UpdateJourneyStepDto,
  ) {
    return this.requestService.updateJourneyStep(id, stepId, user.user, dto);
  }

  @Delete(':id/journey-steps/:stepId')
  removeJourneyStep(
    @UserReal() user: UserReal,
    @Param('id') id: string,
    @Param('stepId') stepId: string,
  ) {
    return this.requestService.removeJourneyStep(id, stepId, user.user);
  }

  @Patch(':id/journey-steps')
  overwriteJourneySteps(
    @UserReal() user: UserReal,
    @Param('id') id: string,
    @Body() dto: OverwriteJourneyStepsDto,
  ) {
    return this.requestService.overwriteJourneySteps(id, user.user, dto);
  }
}
