export interface IChildren {
    id: string;
<<<<<<< HEAD
    fName: string;
    lName: string;
=======
    name: string;
>>>>>>> origin/main
    email: string;
    status?: any;
    address?: any;
    phone?: any;
    role?: any;
    birthDate: string;
    disability: string;
    pfpURL?: any;
    teaches?: any;
    job?: any;
}

export interface IViewChildrenResponse {
    message: string;
    data: IChildren[];
}