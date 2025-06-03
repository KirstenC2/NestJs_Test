import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './files/user.entity';

@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get()
  async findAll(): Promise<User[]> {
    console.log('GET /users - Retrieving all users');
    
    try {
      const users = await this.userRepository.find();
      console.log(`Found ${users.length} users`);
      return users;
    } catch (error) {
      console.error('Error retrieving users:', error);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    console.log(`GET /users/${id} - Retrieving user`);
    
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      
      if (!user) {
        console.warn(`User with ID ${id} not found`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      
      console.log('User found:', user);
      return user;
    } catch (error) {
      console.error(`Error retrieving user ${id}:`, error);
      throw error;
    }
  }
}
