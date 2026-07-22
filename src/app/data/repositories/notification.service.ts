import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppNotification } from '../../core/models/notification.model';
import { ApiResponse, PageResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly url = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getAll(soloNoLeidas = false, size = 20): Observable<AppNotification[]> {
    const params = new HttpParams().set('soloNoLeidas', soloNoLeidas).set('size', size);
    return this.http
      .get<ApiResponse<PageResponse<AppNotification>>>(this.url, { params })
      .pipe(map(r => r.data?.content ?? []));
  }

  getUnreadCount(): Observable<number> {
    return this.http
      .get<ApiResponse<{ count: number }>>(`${this.url}/unread-count`)
      .pipe(map(r => r.data?.count ?? 0));
  }

  markRead(id: number): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.url}/${id}/read`, {})
      .pipe(map(() => undefined));
  }

  markAllRead(): Observable<void> {
    return this.http
      .patch<ApiResponse<void>>(`${this.url}/read-all`, {})
      .pipe(map(() => undefined));
  }
}
