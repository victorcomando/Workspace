import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { AuthGuard } from './auth.guard';
import type { AuthUser } from './auth-user.type';

type AuthBody = {
  email: string;
  password: string;
};

type RequestWithHeaders = {
  headers?: {
    authorization?: string;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: AuthBody) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  login(@Body() body: AuthBody) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  logout(@Req() req: RequestWithHeaders) {
    const authHeader = req.headers?.authorization ?? '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : '';
    return this.authService.logout(token);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }
}
