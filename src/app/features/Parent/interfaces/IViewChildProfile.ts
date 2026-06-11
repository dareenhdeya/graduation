export interface IViewChildProfile {
  message: string;
  data: IChildProfile;
}

export interface IChildProfile {
  id: string;
  fName: string;
  lName: string;
  email: string;
  status: string | null;
  address: string;
  phone: string;
  role: string;
  birthDate: string;
  disability: string | number;
  pfpURL: string | null;
  teaches: string | null;
  job: string;
  subjectsCount: number;
  cvPath: string | null;
  parentContactInfo: IParentContactInfo | null;
}

export interface IParentContactInfo {
  parentEmail: string;
  parentFName: string;
  parentLName?: string; 
  phoneNumber: string;
  reletationShip: string; 
  pProfilePicture: string | null;
}
