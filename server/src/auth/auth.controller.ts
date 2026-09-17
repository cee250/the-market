import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class VendorRegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  businessName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(3)
  phone!: string;

  @IsString()
  @MinLength(2)
  location!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(8)
  confirmPassword!: string;

  @IsString()
  @MinLength(1)
  termsVersion!: string;
  @IsString()
  @MinLength(1)
  packageName!: string;
}

class VerifyEmailDto {
  @IsString()
  @MinLength(20)
  token!: string;
}

class ResetRequestDto {
  @IsEmail()
  email!: string;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(20)
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.register(body.name, body.email, body.password, request);
    response.setHeader('Set-Cookie', result.cookie);
    return { user: result.user, verificationToken: result.verificationToken };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(body.email, body.password, request);
    response.setHeader('Set-Cookie', result.cookie);
    return { user: result.user };
  }

  @Post('register/vendor')
  async registerVendor(@Body() body: VendorRegisterDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.registerVendor(body, request);
    response.setHeader('Set-Cookie', result.cookie);
    return { user: result.user, verificationToken: result.verificationToken };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.headers.cookie);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    response.setHeader('Set-Cookie', `${AuthService.sessionCookieName()}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: Request & { user?: unknown }) {
    return { user: request.user };
  }

  @Post('verify-email')
  @HttpCode(200)
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.auth.verifyEmail(body.token);
  }

  @Post('password-reset/request')
  @HttpCode(200)
  requestPasswordReset(@Body() body: ResetRequestDto) {
    return this.auth.requestPasswordReset(body.email).then(() => ({
      message: 'If an account exists for that email, reset instructions have been sent',
    }));
  }

  @Post('password-reset/confirm')
  @HttpCode(200)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.auth.resetPassword(body.token, body.password);
  }
}
