import { Controller, Get, UseGuards, Request, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthGuard } from '@nestjs/passport';
import { AuthProvider } from './services/auth/auth.provider';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) { }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getHello(@Request() req): object {
    return {
      hello: this.appService.getHello(),
      user: req.user,
    };
  }

}
