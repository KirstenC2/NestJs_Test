import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ name: 'filename', nullable: true })
  filename: string;
  
  // Additional fields not in the schema but needed for file storage
  @Column({ name: 'originalname', nullable: true })
  originalname: string;
  
  @Column({ name: 'mimetype', nullable: true })
  mimetype: string;
  
  @Column('int', { name: 'size', nullable: true })
  size: number;
  
  @Column({ name: 'path', nullable: true })
  path: string;
  
  @Column({ name: 'owner_id' })
  ownerId: string;
  
  @ManyToOne('User', 'files')
  @JoinColumn({ name: 'owner_id' })
  owner: any;
  
  @OneToMany('UserPermission', 'file')
  permissions: any[];
}
