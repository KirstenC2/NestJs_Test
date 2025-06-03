export class File {
  id: string;
  originalname: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploadDate: Date;
  userId: string; // The user who uploaded the file
  permissions: Permission[]; // List of permissions for this file
}

export class Permission {
  userId: string; // User or group ID
  userType: 'user' | 'group'; // Whether this permission is for a user or a group
  accessLevel: 'read' | 'write' | 'delete'; // Permission level
}
