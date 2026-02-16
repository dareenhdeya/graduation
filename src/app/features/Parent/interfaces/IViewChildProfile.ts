export interface Parent {
	phoneNumber: string;
	address?: any;
	job?: any;
	reletationShip: number;
	students?: any;
	id: string;
	emailorUserName: string;
	profilePicture: string;
	password?: any;
	role: number;
	gender?: any;
	status: number;
	fName: string;
	lName: string;
	refreshToken?: any;
}

export interface IChildProfile {
	id: string;
	fName: string;
	lName: string;
	email: string;
	status?: any;
	address: string;
	phone?: any;
	role: string;
	birthDate: string;
	disability: string;
	parent: Parent;
	pfpURL?: any;
	teaches?: any;
	job: string;
}

export interface IViewChildProfile {
	message: string;
	data: IChildProfile;
}