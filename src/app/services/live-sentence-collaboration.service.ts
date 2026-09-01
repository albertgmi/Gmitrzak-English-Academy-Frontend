import { inject, Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface SentenceActiveCollaborator {
    connectionId: string;
    username: string;
    role: string;
    avatarUrl?: string;
    joinedAt: string;
}

export interface SentenceContentChangeEvent {
    content: string;
    field: string;
    senderUsername: string;
    timestamp: string;
}

export interface SentenceSelectionChangeEvent {
    index: number;
    length: number;
    senderUsername: string;
    senderRole: string;
}

export interface SentenceTeacherNoteEvent {
    noteId: string;
    selectedText: string;
    noteContent: string;
    category: string;
    author: string;
    timestamp: string;
    isArchived?: boolean;
}

@Injectable({ providedIn: 'root' })
export class LiveSentenceCollaborationService {
    private authService = inject(AuthService);
    private hubConnection: signalR.HubConnection | null = null;

    connectionState = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
    activeUsers = signal<SentenceActiveCollaborator[]>([]);
    incomingContentChange = signal<SentenceContentChangeEvent | null>(null);
    incomingSelectionChange = signal<SentenceSelectionChangeEvent | null>(null);
    incomingTeacherNote = signal<SentenceTeacherNoteEvent | null>(null);
    typingUser = signal<{ isTyping: boolean; senderUsername: string } | null>(null);

    private currentAnswerId: number | null = null;

    async startConnection(): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            return;
        }

        const hubUrl = `${environment.apiUrl}/hubs/sentence-collaboration`;
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
            console.log('[SignalR] Connected to SentenceCollaborationHub successfully');
        } catch (err) {
            console.error('[SignalR] Connection failed:', err);
            this.connectionState.set('disconnected');
        }
    }

    private registerHandlers(): void {
        if (!this.hubConnection) return;

        this.hubConnection.on('ActiveUsersUpdated', (users: SentenceActiveCollaborator[]) => {
            this.activeUsers.set(users);
        });

        this.hubConnection.on('UserJoined', (user: SentenceActiveCollaborator) => {
            console.log('[SignalR] Sentence room user joined:', user.username);
        });

        this.hubConnection.on('UserLeft', (user: SentenceActiveCollaborator) => {
            console.log('[SignalR] Sentence room user left:', user.username);
        });

        this.hubConnection.on('ReceiveContentChange', (data: SentenceContentChangeEvent) => {
            this.incomingContentChange.set(data);
        });

        this.hubConnection.on('ReceiveSelectionChange', (data: SentenceSelectionChangeEvent) => {
            this.incomingSelectionChange.set(data);
        });

        this.hubConnection.on('ReceiveTeacherNote', (data: SentenceTeacherNoteEvent) => {
            this.incomingTeacherNote.set(data);
        });

        this.hubConnection.on('ReceiveTypingStatus', (data: { isTyping: boolean; senderUsername: string }) => {
            this.typingUser.set(data);
        });
    }

    async joinRoom(answerId: number, username: string, role: string, avatarUrl?: string): Promise<void> {
        await this.startConnection();
        if (this.currentAnswerId && this.currentAnswerId !== answerId) {
            await this.leaveRoom(this.currentAnswerId);
        } else {
            this.clearSignals();
        }

        this.currentAnswerId = answerId;

        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('JoinSentenceRoom', answerId, username, role, avatarUrl);
        }
    }

    async leaveRoom(answerId: number): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('LeaveSentenceRoom', answerId);
        }
        if (this.currentAnswerId === answerId) {
            this.currentAnswerId = null;
        }
        this.activeUsers.set([]);
        this.clearSignals();
    }

    clearSignals(): void {
        this.incomingContentChange.set(null);
        this.incomingSelectionChange.set(null);
        this.incomingTeacherNote.set(null);
        this.typingUser.set(null);
    }

    async sendContentChange(answerId: number, content: string, field: string, senderUsername: string): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('SendContentChange', answerId, content, field, senderUsername);
        }
    }

    async sendSelectionChange(answerId: number, index: number, length: number, senderUsername: string, senderRole: string): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('SendSelectionChange', answerId, index, length, senderUsername, senderRole);
        }
    }

    async sendTeacherNote(answerId: number, noteId: string, selectedText: string, noteContent: string, category: string, author: string): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('SendTeacherNote', answerId, noteId, selectedText, noteContent, category, author);
        }
    }

    async sendTypingStatus(answerId: number, isTyping: boolean, senderUsername: string): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('SendTypingStatus', answerId, isTyping, senderUsername);
        }
    }

    async stopConnection(): Promise<void> {
        if (this.currentAnswerId) {
            await this.leaveRoom(this.currentAnswerId);
        }
        if (this.hubConnection) {
            await this.hubConnection.stop();
            this.hubConnection = null;
        }
        this.clearSignals();
        this.connectionState.set('disconnected');
    }
}
