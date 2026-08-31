import { Injectable } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Observable, type Subscriber } from 'rxjs';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { OutboxEventEntity } from '../../database/entities/outbox-event.entity';

export type RealtimeEvent = { id: string; type: string; payload: Record<string, unknown>; createdAt: string };

@Injectable()
export class RealtimeEventsService {
  private readonly subscribers = new Set<Subscriber<MessageEvent>>();

  constructor(@InjectRepository(OutboxEventEntity) private readonly outbox: Repository<OutboxEventEntity>) {}

  async publish(type: string, payload: Record<string, unknown> = {}) {
    const createdAt = new Date().toISOString();
    const event: RealtimeEvent = { id: randomUUID(), type, payload, createdAt };
    await this.outbox.save({
      id: event.id,
      type: 'frontend_changed',
      payload: JSON.stringify(event),
      status: 'sent',
      attempts: 0,
      nextAttemptAt: createdAt,
      createdAt,
    });
    const message = { id: event.id, type: event.type, data: event.payload } as MessageEvent;
    for (const subscriber of this.subscribers) subscriber.next(message);
  }

  stream() {
    return new Observable<MessageEvent>(subscriber => {
      this.subscribers.add(subscriber);
      subscriber.next({ type: 'connected', data: { at: new Date().toISOString() } } as MessageEvent);
      return () => this.subscribers.delete(subscriber);
    });
  }
}
