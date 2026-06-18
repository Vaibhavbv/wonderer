import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseWrapper<T> {
  success: boolean;
  data: T;
  meta?: any;
  error?: null;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseWrapper<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseWrapper<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped, return as-is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Handle pagination meta
        const meta = data?.meta || data?.pagination || undefined;
        const pureData = data?.data !== undefined ? data.data : data;

        return {
          success: true,
          data: pureData ?? null,
          meta: meta || undefined,
          error: null,
        };
      }),
    );
  }
}
