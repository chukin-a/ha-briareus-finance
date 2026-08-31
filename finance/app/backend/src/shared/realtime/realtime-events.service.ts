import { Injectable } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable, type Subscriber } from 'rxjs';
import { randomUUID } from 'node:crypto';

export type RealtimeEvent = { id: string; type: string; payload: Record<string, unknown>; createdAt: string };

@Injectable()
export class RealtimeEventsService {
  private readonly subscribers = new Set<Subscriber<MessageEvent>>();

  publish(type: string, payload: Record<string, unknown> = {}) {
    const createdAt = new Date().toISOString();
    const event: RealtimeEvent = { id: randomUUID(), type, payload, createdAt };
    const message = { id: event.id, type: event.type, data: event.payload } as MessageEvent;
    for (const subscriber of this.subscribers) subscriber.next(message);
  }

  publishChanged(resource: string, id?: string) {
    return this.publish(`${resource}.changed`, id ? { id } : {});
  }

  stream() {
    return new Observable<MessageEvent>(subscriber => {
      this.subscribers.add(subscriber);
      subscriber.next({ type: 'connected', data: { at: new Date().toISOString() } } as MessageEvent);
      const heartbeat = setInterval(() => {
        subscriber.next({ type: 'heartbeat', data: { at: new Date().toISOString() } } as MessageEvent);
      }, 15000);
      return () => {
        clearInterval(heartbeat);
        this.subscribers.delete(subscriber);
      };
    });
  }
}
