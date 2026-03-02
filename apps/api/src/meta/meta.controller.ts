import { Controller, Get } from '@nestjs/common';
import { MetaService } from './meta.service';

@Controller('meta')
export class MetaController {
  constructor(private readonly metaService: MetaService) {}

  @Get('version')
  async getVersion() {
    return this.metaService.getVersionWithUpdate();
  }
}
