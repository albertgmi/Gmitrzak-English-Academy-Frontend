import { inject, Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ActiveCollaborator {
    connectionId: string;
    username: string;
    role: string;
    joinedAt: string;
}

export interface ContentChangeEvent {
    content: string;
    field: string;
    senderUsername: string;
    timestamp: string;
}

export interface SelectionChangeEvent {
    index: number;
    length: number;
    senderUsername: string;
    senderRole: string;
}

export interface TeacherNoteEvent {
    noteId: string;
    selectedText: string;
    noteContent: string;
    category: string;
    author: string;
    timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class LiveEssayCollaborationService {
    private authService = inject(AuthService);
    private hubConnection: signalR.HubConnection | null = null;

    connectionState = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
    activeUsers = signal<ActiveCollaborator[]>([]);
    incomingContentChange = signal<ContentChangeEvent | null>(null);
    incomingSelectionChange = signal<SelectionChangeEvent | null>(null);
    incomingTeacherNote = signal<TeacherNoteEvent | null>(null);
    typingUser = signal<{ isTyping: boolean; senderUsername: string } | null>(null);

    private currentEssayId: number | null = null;

    async startConnection(): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            return;
        }

        const hubUrl = `${environment.apiUrl}/hubs/essay`;
        const token = this.authService.getToken();

        this.connectionState.set('connecting');

        this.hubConnection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token ?? ''
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        this.registerHandlers();

        try {
            await this.hubConnection.start();
            this.connectionState.set('connected');
            console.log('[SignalR] Connected to EssayHub successfully');
        } catch (err) {
            console.error('[SignalR] Connection failed:', err);
            this.connectionState.set('disconnected');
        }
    }

    private registerHandlers(): void {
        if (!this.hubConnection) return;

        this.hubConnection.on('ActiveUsersUpdated', (users: ActiveCollaborator[]) => {
            this.activeUsers.set(users);
        });

        this.hubConnection.on('UserJoined', (user: ActiveCollaborator) => {
            console.log('[SignalR] User joined:', user.username);
        });

        this.hubConnection.on('UserLeft', (user: ActiveCollaborator) => {
            console.log('[SignalR] User left:', user.username);
        });

        this.hubConnection.on('ReceiveContentChange', (data: ContentChangeEvent) => {
            this.incomingContentChange.set(data);
        });

        this.hubConnection.on('ReceiveSelectionChange', (data: SelectionChangeEvent) => {
            this.incomingSelectionChange.set(data);
        });

        this.hubConnection.on('ReceiveTeacherNote', (data: TeacherNoteEvent) => {
            this.incomingTeacherNote.set(data);
        });

        this.hubConnection.on('ReceiveTypingStatus', (data: { isTyping: boolean; senderUsername: string }) => {
            this.typingUser.set(data);
        });
    }

    async joinRoom(essayId: number, username: string, role: string): Promise<void> {
        await this.startConnection();
        if (this.currentEssayId && this.currentEssayId !== essayId) {
            await this.leaveRoom(this.currentEssayId);
        }

        this.currentEssayId = essayId;

        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('JoinEssayRoom', essayId, username, role);
        }
    }

    async leaveRoom(essayId: number): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('LeaveEssayRoom', essayId);
        }
        if (this.currentEssayId === essayId) {
            this.currentEssayId = null;
        }
        this.activeUsers.set([]);
    }

    async sendContentChange(essayId: number, content: string, field: string, senderUsername: string): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('SendContentChange', essayId, content, field, senderUsername);
        }
    }

    async sendSelectionChange(essayId: number, index: number, length: number, senderUsername: string, senderRole: string): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('SendSelectionChange', essayId, index, length, senderUsername, senderRole);
        }
    }

    async sendTeacherNote(essayId: number, noteId: string, selectedText: string, noteContent: string, category: string, author: string): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('SendTeacherNote', essayId, noteId, selectedText, noteContent, category, author);
        }
    }

    async sendTypingStatus(essayId: number, isTyping: boolean, senderUsername: string): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('SendTypingStatus', essayId, isTyping, senderUsername);
        }
    }

    async stopConnection(): Promise<void> {
        if (this.currentEssayId) {
            await this.leaveRoom(this.currentEssayId);
        }
        if (this.hubConnection) {
            await this.hubConnection.stop();
            this.hubConnection = null;
        }
        this.connectionState.set('disconnected');
    }
}
