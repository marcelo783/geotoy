import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('🛡️ JwtAuthGuard ativado');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    console.log('🔔 handleRequest called — user present?', Boolean(user), ' err?', Boolean(err), ' info?', info?.message);
    if (err) {
      console.warn('❌ handleRequest recebeu err:', err);
      throw err;
    }
    if (!user) {
      console.warn('❌ handleRequest: user falsy -> lançando UnauthorizedException; info:', info?.message);
      throw new UnauthorizedException(info?.message || 'Unauthorized');
    }
    console.log('✅ JwtAuthGuard liberou acesso para:', user.email || user.id);
    return user;
  }
}
