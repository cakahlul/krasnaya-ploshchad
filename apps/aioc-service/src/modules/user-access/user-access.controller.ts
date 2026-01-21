import { Controller, Get, Param } from '@nestjs/common';
import { UserAccessService } from './user-access.service';
import { UserAccessDto } from './dto/user-access.dto';

@Controller('user-access')
export class UserAccessController {
  constructor(private readonly userAccessService: UserAccessService) {}

  @Get(':email')
  async getUserAccess(@Param('email') email: string): Promise<UserAccessDto> {
    return this.userAccessService.getUserAccess(email);
  }
}
