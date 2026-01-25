import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Investor } from './schemas/investor.schema';
import { UserService } from '../user/user.service';
import { RoleService } from '../role/role.service';
import { InvestorCreateI } from './investor.types';

@Injectable()
export class InvestorService {
  constructor(
    @InjectModel(Investor.name) private readonly investorModel: Model<Investor>,
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  async create(investor: InvestorCreateI): Promise<Investor> {
    const selectedRole = await this.roleService.findById(investor.role);
    if (selectedRole.name.toLowerCase() !== 'investor')
      throw new BadRequestException(
        'Role must be investor to create investor profile',
      );

    const createdUser = await this.userService.create({
      fullName: investor.fullName,
      address: investor.address,
      nicNumber: investor.nicNumber,
      email: investor.email,
      phoneNumber: investor.phoneNumber,
      password: investor.password,
      role: investor.role,
    });

    return await this.investorModel.create({
      ...investor,
      user: new Types.ObjectId(createdUser._id),
    });
  }
}
