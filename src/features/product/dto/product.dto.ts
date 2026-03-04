
import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsEnum, IsOptional, MaxLength, Min } from 'class-validator';

export enum ProductCondition {
    NEW = 'new',
    LIKE_NEW = 'like_new',
    GOOD = 'good',
    FAIR = 'fair',
    POOR = 'poor'
}

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(1000)
    description!: string;

    // Must be parsed from string if multipart/form-data
    // but class-validator usually runs after multer and potentially explicit parsing
    // In express, req.body fields are strings for multipart unless parsed.
    // I will use IsNotEmpty and handle parsing in controller if needed.
    // However, validation runs on object.

    // Using simple validation assuming middleware or controller parses it to number/boolean

    @IsNotEmpty()
    price!: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    quantity!: number;

    @IsOptional()
    negotiable?: boolean;

    @IsEnum(ProductCondition)
    @IsNotEmpty()
    condition!: ProductCondition;

    @IsString()
    @IsNotEmpty()
    categoryId!: string;

    @IsString()
    @IsNotEmpty()
    campus!: string;

    // Images are handled via multer, so just validation might be on the fact they exist
    // But typically DTO is for body fields.
}

export class UpdateProductDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    price?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    quantity?: number;

    @IsOptional()
    negotiable?: boolean;

    @IsOptional()
    @IsEnum(ProductCondition)
    condition?: ProductCondition;

    @IsOptional()
    @IsString()
    categoryId?: string;

    @IsOptional()
    @IsString()
    campus?: string;

    // For updating images, we might add/remove. 
    // Usually replacing images or adding new ones is complex.
    // Simple approach: Allow adding new images via upload (handled separate logic?)
    // Or just updating text fields here.
    // User requirement: "PATCH /:id -> update (only owner, only if available)"
    // Typically allows updating fields.
}

export enum ProductStatus {
    AVAILABLE = 'available',
    RESERVED = 'reserved',
    SOLD = 'sold',
    DELETED = 'deleted'
}

export class ChangeStatusDto {
    @IsEnum(ProductStatus)
    @IsNotEmpty()
    status!: ProductStatus;
}
