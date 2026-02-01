export interface IADMIN {
    id: string;
  name: string | null;
  email: string | null;
  address: string | null;
  phone: string | null;
  role: 'Admin' | 'Parent' | 'Teacher' | 'Student' | string;
  birthDate: string | null;
  disability: string | null;
  pfpURL: string | null;
  teaches: any | null;
}

export interface ShowUsersResponse {
    message: string; 
    data: IADMIN[];
  }

  
  export interface ViewUserResponse {
    message: string;
    data: IADMIN;
  }
  
