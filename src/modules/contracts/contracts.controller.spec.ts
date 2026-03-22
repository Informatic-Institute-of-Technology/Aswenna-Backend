import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthorizationGuard } from 'src/core/guards/authorization.guard';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

describe('ContractsController', () => {
  let controller: ContractsController;
  let contractsService: { create: jest.Mock };

  const userId = '67d3e18216f3ec23296efaa3';

  beforeEach(async () => {
    contractsService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContractsController],
      providers: [
        { provide: ContractsService, useValue: contractsService },
        {
          provide: AuthorizationGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: jest.fn().mockReturnValue(true) },
        },
      ],
    }).compile();

    controller = module.get<ContractsController>(ContractsController);
  });

  it('create delegates to service', async () => {
    const dto = {
      type: 'investor-harvest-base',
      offer: '67d3e18216f3ec23296efaa1',
      farmer: '67d3e18216f3ec23296efaa2',
      milestones: [
        {
          title: 'Phase 1',
          description: 'Preparation',
          startDate: '2026-01-01',
          endDate: '2026-02-01',
          payment: 500,
        },
      ],
      financialBreakdown: [{ category: 'Seeds', amount: 500 }],
    };

    const response = { _id: '67d3e18216f3ec23296efab9' };
    contractsService.create.mockResolvedValue(response);

    const result = await controller.create(dto as any, userId);

    expect(contractsService.create).toHaveBeenCalledWith(dto, userId);
    expect(result).toEqual(response);
  });
});
