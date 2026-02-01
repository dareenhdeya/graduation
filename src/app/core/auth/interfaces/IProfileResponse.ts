export type Role = 'Admin' | 'Parent' | 'Teacher' | 'Student';

export interface ProfileDTO {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  role: Role;
  birthDate: string | null;
  disability: string | null;
  pfURL: string | null;
  teaches: any;
}

export interface ViewProfileResponse {
  message: string;
  data: ProfileDTO;
}
