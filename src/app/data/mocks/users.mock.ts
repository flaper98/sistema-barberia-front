import { User } from '../../core/models/user.model';

export const MOCK_USERS: User[] = [
  {
    id: 1,
    nombre: 'Carlos',
    apellido: 'Mendoza',
    email: 'admin@barbersystem.com',
    rol: 'ADMIN',
    estado: true,
    avatar: 'CM',
    createdAt: '2024-01-15',
  },
  {
    id: 2,
    nombre: 'Miguel',
    apellido: 'Torres',
    email: 'miguel@barbersystem.com',
    rol: 'BARBER',
    estado: true,
    avatar: 'MT',
    createdAt: '2024-02-01',
  },
  {
    id: 3,
    nombre: 'Andrés',
    apellido: 'Ríos',
    email: 'andres@barbersystem.com',
    rol: 'BARBER',
    estado: true,
    avatar: 'AR',
    createdAt: '2024-02-10',
  },
  {
    id: 4,
    nombre: 'Sofía',
    apellido: 'Vargas',
    email: 'sofia@barbersystem.com',
    rol: 'CASHIER',
    estado: true,
    avatar: 'SV',
    createdAt: '2024-03-05',
  },
  {
    id: 5,
    nombre: 'Lucía',
    apellido: 'Paredes',
    email: 'lucia@barbersystem.com',
    rol: 'RECEPTION',
    estado: true,
    avatar: 'LP',
    createdAt: '2024-03-10',
  },
];

export const MOCK_CREDENTIALS: { email: string; password: string; userId: number }[] = [
  { email: 'admin@barbersystem.com',  password: '123456', userId: 1 },
  { email: 'miguel@barbersystem.com', password: '123456', userId: 2 },
  { email: 'andres@barbersystem.com', password: '123456', userId: 3 },
  { email: 'sofia@barbersystem.com',  password: '123456', userId: 4 },
  { email: 'lucia@barbersystem.com',  password: '123456', userId: 5 },
];
