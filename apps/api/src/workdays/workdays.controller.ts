import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthUser } from '../auth/auth-user.type';
import { CurrentUser } from '../auth/current-user.decorator';
import { WorkdaysService } from './workdays.service';

type CreateWorkdayBody = {
  date: string;
  jobName: string;
  worked?: boolean;
  obs?: string | null;
};

type UpdateWorkdayBody = {
  date?: string;
  jobName?: string;
  worked?: boolean;
  obs?: string | null;
};

@UseGuards(AuthGuard)
@Controller('workdays')
export class WorkdaysController {
  constructor(private readonly workdaysService: WorkdaysService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '30',
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.workdaysService.findAll(
      user.id,
      Number(page),
      Number(limit),
      start,
      end,
    );
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateWorkdayBody) {
    return this.workdaysService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateWorkdayBody,
  ) {
    return this.workdaysService.update(user.id, Number(id), body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.workdaysService.delete(user.id, Number(id));
  }
}
