import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class PermissionService {
  async findAll() {
    throw new NotImplementedException();
  }

  async findById(target: string) {
    throw new NotImplementedException();
  }

  async create(permission: any) {
    throw new NotImplementedException();
  }

  async updateById(target: string, permission: any) {
    throw new NotImplementedException();
  }

  async deleteById(target: string) {
    throw new NotImplementedException();
  }
}
