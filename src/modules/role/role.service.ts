import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class RoleService {
  async findAll() {
    throw new NotImplementedException();
  }

  async findById(target: string) {
    throw new NotImplementedException();
  }

  async create(role: any) {
    throw new NotImplementedException();
  }

  async updateById(target: string, role: any) {
    throw new NotImplementedException();
  }

  async deleteById(target: string) {
    throw new NotImplementedException();
  }
}
