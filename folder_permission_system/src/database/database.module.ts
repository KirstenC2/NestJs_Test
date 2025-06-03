import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'test_user',
      password: 'test_password',
      database: 'files',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: true, // set to false in production
    }),
  ],
})
export class DatabaseModule {}
