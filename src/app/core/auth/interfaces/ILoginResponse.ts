export interface Data {
	accessToken: string;
	refreshToken: string;
}

export interface ILoginResponse {
	message: string;
	data: Data;
}

// {
//     "message": "Logined Successfully",
//     "data": {
//         "accessToken": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Ijdhc3NhbmFzMzRAZ21haWwuY29tIiwibmFtZWlkIjoiNDQyYzFjYmMtZjYwNS00NTE0LWE2NGYtY2FmNzhjMzU5ZTEyIiwiZ2l2ZW5fbmFtZSI6IkFkbWluIiwicm9sZSI6IkFkbWluIiwibmJmIjoxNzYzNjg2MjY1LCJleHAiOjE3NjM2ODcxNjUsImlhdCI6MTc2MzY4NjI2NX0._imfCPnpSMOnhJv8A-5EOv98XDkOErEcMwN-wf7rza0",
//         "refreshToken": "ryOlF6anjCXSbi/Z4MucBehmq0NbF22fyGov3duBD8e+WWmTMlVzf2hHoZl+DMtIP8D7oIFkirlUmbTzB4Mvrg=="
//     }
// }