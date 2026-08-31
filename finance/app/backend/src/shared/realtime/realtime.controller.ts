import { Controller, Sse } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { RealtimeEventsService } from './realtime-events.service';

@Controller('events')
export class RealtimeController {
  constructor(private readonly events: RealtimeEventsService) {}

  @Sse()
  stream(): Observable<MessageEvent> {
    return this.events.stream();
  }
}
