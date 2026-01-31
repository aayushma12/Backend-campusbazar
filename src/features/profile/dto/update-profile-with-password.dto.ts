import { IsOptional, IsString, MinLength, IsEmail } from 'class-validator';

export class UpdateProfileWithPasswordDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsOptional()
    @IsString()
    studentId?: string;

    @IsOptional()
    @IsString()
    batch?: string;

    @IsOptional()
    @IsString()
    collegeId?: string;

    // Password change fields
    @IsOptional()
    @IsString()
    oldPassword?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    newPassword?: string;
}
