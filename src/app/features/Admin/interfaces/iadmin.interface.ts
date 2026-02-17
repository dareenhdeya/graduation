export interface IADMIN {
  id: string;
  fName: string | null;
  lName: string | null;
  email: string | null;
  status: number;
  address: string | null;
  phone: string | null;
  role: 'Parent' | 'Teacher' | 'Student' | string;
  birthDate: string | null;
  disability: string | null;
  pfpURL: string | null;
  teaches: string | null;
  job: string | null;
}

export interface ShowUsersResponse {
  message: string;
  data: IADMIN[];
}

export interface ViewUserResponse {
  message: string;
  data: IADMIN;
}
