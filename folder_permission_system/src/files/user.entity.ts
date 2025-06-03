import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @OneToMany('File', 'owner')
  files: any[];

  @OneToMany('UserPermission', 'user')
  permissions: any[];
}
