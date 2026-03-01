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
import { NotesService } from './notes.service';

type CreateNoteBody = {
  title: string;
  content?: string | null;
  pinned?: boolean;
};

type UpdateNoteBody = {
  title?: string;
  content?: string | null;
  pinned?: boolean;
};

@UseGuards(AuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('q') query?: string,
  ) {
    return this.notesService.findAll(
      user.id,
      Number(page),
      Number(limit),
      query,
    );
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateNoteBody) {
    return this.notesService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateNoteBody,
  ) {
    return this.notesService.update(user.id, Number(id), body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notesService.remove(user.id, Number(id));
  }
}
