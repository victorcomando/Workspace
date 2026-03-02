import { Module } from '@nestjs/common';
import { NotesModule } from './notes/notes.module';
import { WorkdaysModule } from './workdays/workdays.module';
import { SalaryModule } from './salary/salary.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './reports/reports.module';
import { MetaModule } from './meta/meta.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    WorkdaysModule,
    NotesModule,
    SalaryModule,
    ReportsModule,
    MetaModule,
  ],
})
export class AppModule {}
