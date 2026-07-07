import { User, CoachingSession } from './types';

// 4 user default sesuai UserSeeder backend
export const INITIAL_USERS: User[] = [
  {
    id: 'admin-1234-5678-9012-345678901234',
    name: 'Admin System',
    email: 'admin@desnet.id',
    phone: '081234567890',
    gender: 'Laki-laki',
    position: 'Administrator',
    role: 'Admin',
    status: 'Active',
    password: 'password123'
  },
  {
    id: 'hod-1234-5678-9012-345678901234',
    name: 'Budi (HOD)',
    email: 'hod@desnet.id',
    phone: '081234567891',
    gender: 'Laki-laki',
    position: 'Head of Department',
    role: 'HOD',
    status: 'Active',
    password: 'password123'
  },
  {
    id: 'spv-1234-5678-9012-345678901234',
    name: 'Siti (Supervisi)',
    email: 'supervisi@desnet.id',
    phone: '081234567892',
    gender: 'Perempuan',
    position: 'Supervisor',
    role: 'Supervisi',
    status: 'Active',
    password: 'password123'
  },
  {
    id: 'emp-1234-5678-9012-345678901234',
    name: 'Andi (Karyawan)',
    email: 'karyawan@desnet.id',
    phone: '081234567893',
    gender: 'Laki-laki',
    position: 'Staff IT',
    role: 'Karyawan',
    status: 'Active',
    password: 'password123'
  }
];

export const CATEGORY_MAP: Record<string, number> = {
  'Technical Skills Development': 1,
  'Soft Skills & Communication': 2,
  'Leadership & Management': 3,
  'Career Planning & Development': 4
};

export const TOP_TOPICS = Object.keys(CATEGORY_MAP);

export const MEETING_ROOMS = [
  'Ruangan Alpha (Lantai 2 - Samping Lift)',
  'Ruangan Beta (Lantai 2 - Dekat Pantry)',
  'Ruangan Gamma (Lantai 3 - Ruang Utama)',
  'Ruangan Delta (Lantai 3 - Dekat Balkon)',
  'Ruangan Epsilon (Lantai 4 - Ruang Direksi)'
];

// Peta nama ruangan ke room_id di database (sesuai RoomSeeder)
export const ROOM_MAP: Record<string, number> = {
  'Ruangan Alpha (Lantai 2 - Samping Lift)': 1,
  'Ruangan Beta (Lantai 2 - Dekat Pantry)': 2,
  'Ruangan Gamma (Lantai 3 - Ruang Utama)': 3,
  'Ruangan Delta (Lantai 3 - Dekat Balkon)': 4,
  'Ruangan Epsilon (Lantai 4 - Ruang Direksi)': 5,
};

export const INITIAL_SESSIONS: CoachingSession[] = [];
