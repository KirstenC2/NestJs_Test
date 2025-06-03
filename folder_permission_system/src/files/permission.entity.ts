import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('user_permissions')
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'file_id' })
  fileId: string;

  @Column({ name: 'can_read', default: false })
  canRead: boolean;

  @Column({ name: 'can_write', default: false })
  canWrite: boolean;

  @Column({ name: 'can_delete', default: false })
  canDelete: boolean;

  @ManyToOne('File', 'permissions')
  @JoinColumn({ name: 'file_id' })
  file: any;

  @ManyToOne('User', 'permissions')
  @JoinColumn({ name: 'user_id' })
  user: any;
}
