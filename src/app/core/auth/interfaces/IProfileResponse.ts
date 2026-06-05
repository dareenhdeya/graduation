export type Role = 'Admin' | 'Parent' | 'Teacher' | 'Student';

export interface ProfileData {
  id: string;
  fName: string;
  lName: string;
  email: string;
  address?: string | null;
  phone?: string | null;
  role: Role;
  // role: string;
  birthDate?: string | null;
  pfpURL?: string | null;
  disability?: string | null;
  teaches?: string | null;
  job?: string | null;
  subjectsCount: number | null;
}

export interface ViewProfileResponse {
  message: string;
  data: ProfileData;
}
