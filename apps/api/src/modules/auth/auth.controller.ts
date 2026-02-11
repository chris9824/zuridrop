import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto } from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Créer un nouveau compte (retourne accessToken + refreshToken)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Se connecter',
    description:
      'Retourne un accessToken et un refreshToken.\n\n' +
      '**Swagger:** copiez le `accessToken` puis cliquez sur **Authorize** (cadenas) ' +
      'et collez-le pour authentifier vos requêtes.\n\n' +
      'En DEV, le token est valide 8h pour éviter les 401 intempestifs.',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Rafraîchir le token d\'accès',
    description:
      'Envoyez le `refreshToken` dans le body. ' +
      'L\'ancien refresh token est révoqué (rotation) et un nouveau couple access+refresh est retourné.',
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Se déconnecter (révoque le refresh token)',
    description: 'Si refreshToken est fourni, seul ce token est révoqué. Sinon, tous les refresh tokens du user sont révoqués.',
  })
  logout(@CurrentUser() user: any, @Body() dto: LogoutDto) {
    return this.authService.logout(user.id, dto.refreshToken);
  }
}
