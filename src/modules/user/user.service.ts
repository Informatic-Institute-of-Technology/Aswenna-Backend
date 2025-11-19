import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class UserService {
  async findAll() {
    throw new NotImplementedException();
  }

  async findById(target: string) {
    throw new NotImplementedException();
  }

  async create(user: any) {
    throw new NotImplementedException();
  }

  async updateById(target: string, user: any) {
    throw new NotImplementedException();
  }

  async deleteById(target: string) {
    throw new NotImplementedException();
  }
}
