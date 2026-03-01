import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { ReportsService } from './reports.service';

@UseGuards(AuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('work-export')
  getWorkExport(
    @CurrentUser() user: AuthUser,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('job') job = 'all',
    @Query('includeValues') includeValues?: string,
  ) {
    return this.reportsService.getWorkExport(user.id, {
      month,
      year,
      job,
      includeValues,
    });
  }
}
