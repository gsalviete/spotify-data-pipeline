import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, catchError, from, switchMap, throwError } from "rxjs";
import { AuthService } from "../../modules/auth/auth.service";

@Injectable()
export class SpotifyTokenInterceptor implements NestInterceptor {
  constructor(private readonly authService: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error.response?.status === 401) {
          const request = context.switchToHttp().getRequest();
          const spotifyId = request.session?.userId;

          return from(this.authService.refreshAccessToken(spotifyId)).pipe(
            switchMap(() => next.handle()),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
