import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { SalaryService } from './salary.service';

type SalaryConfigBody = {
  local: string;
  tipo: string;
  valor: number;
};

type SalaryConfigUpdateBody = Partial<SalaryConfigBody>;

@UseGuards(AuthGuard)
@Controller('salary')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Get('locals')
  findKnownLocals(@CurrentUser() user: AuthUser) {
    return this.salaryService.findKnownLocals(user.id);
  }

  @Get('configs')
  findConfigs(@CurrentUser() user: AuthUser) {
    return this.salaryService.findConfigs(user.id);
  }

  @Post('configs')
  createConfig(@CurrentUser() user: AuthUser, @Body() body: SalaryConfigBody) {
    return this.salaryService.createConfig(user.id, body);
  }

  @Patch('configs/:id')
  updateConfig(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: SalaryConfigUpdateBody,
  ) {
    return this.salaryService.updateConfig(user.id, id, body);
  }

  @Delete('configs/:id')
  removeConfig(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.salaryService.removeConfig(user.id, id);
  }

  @Get('summary')
  getMonthlySummary(
    @CurrentUser() user: AuthUser,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.salaryService.getMonthlySummary(user.id, month, year);
  }
}
