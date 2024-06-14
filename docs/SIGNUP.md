# Signup API

## Fetch Info From CV

Method: *POST*

Endpoint: `/auth/fetchSignupInfoFromCv`

Req body: (just like `signUpWithCV` endpoint)
```json
{
  "file": "string($binary)"
}
```
Response:

```json
{
  "status": "success",
  "message": "Initial User created successfully. Please check email to verify your email",
  "data": {
    "userId": "c7ac4c35-ec8f-4226-a408-3f2b6eff4687",
    "cvLibUserId": 1715754942923,
    "email": "inewton8@icloud.com",
    "firstName": "Isaac",
    "lastName": "Newton",
    "location": "Manchester",
    "county": "Greater Manchester",
    "postcode": "M2 3GX",
    "phone": "07562913859",
    "role": "client",
    "isCvProcessing": true,
    "isActive": false,
    "cvUrl": "uploaded-files/users/c7ac4c35-ec8f-4226-a408-3f2b6eff4687/upload/ba05fdcb-41dd-4b48-92f4-e831f18e0cd1.docx",
    "isPhoneActive": false,
    "isEmailActive": false,
    "profileImageUrl": "0",
    "hasUploadedCV": false,
    "isCvValuatorProcessing": false,
    "status": "offline",
    "createdAt": "2024-05-15T00:35:42.971Z",
    "updatedAt": "2024-05-15T00:35:42.000Z",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjN2FjNGMzNS1lYzhmLTQyMjYtYTQwOC0zZjJiNmVmZjQ2ODciLCJlbWFpbCI6ImluZXd0b244QGljbG91ZC5jb20iLCJyb2xlIjoiY2xpZW50IiwiaWF0IjoxNzE1NzU0OTQyLCJleHAiOjE3MTcwNTA5NDJ9.3FmGdKn8D9BZQOYk17fh7FyxkypnvwxpxWHrcTqMt_8"
  }
}
```


## Signup with fetched info from CV

Method: *POST*

Endpoint: `/auth/signupWithInfoFromCV`

Req body: (just like `signUpWithCV` endpoint)
```ts
class SignupWithCVInfoDto {
  @ApiProperty({
    description: "User ID"
  })
  @IsString()
  @IsOptional()
  userId: string;

  @ApiProperty({
    description: "First Name"
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "Last Name"
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "Email"
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "Phone Number"
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: "Password"
  })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    description: "county"
  })
  @IsString()
  @IsNotEmpty()
  county: string;

  @ApiProperty({
    description: "postcode"
  })
  @IsString()
  @IsNotEmpty()
  postcode: string;

  @ApiProperty({
    description: "location"
  })
  @IsString()
  @IsNotEmpty()
  location: string;
}
```
Response:

```json
{
}
```

