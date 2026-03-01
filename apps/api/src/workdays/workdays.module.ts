import { Module } from '@nestjs/common';
import { WorkdaysController } from './workdays.controller';
import { WorkdaysService } from './workdays.service';

@Module({
  controllers: [WorkdaysController],
  providers: [WorkdaysService],
})
export class WorkdaysModule {}
