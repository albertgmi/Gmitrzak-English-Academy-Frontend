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

export interface LiveChatMessage {
    senderUsername: string;
    senderRole: string;
    message: string;
    timestamp: string;
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

export interface LiveGradeEvent {
    grammarScore: number;
    vocabScore: number;
    structureScore: number;
    feedbackNotes: string;
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
    incomingLiveGrade = signal<LiveGradeEvent | null>(null);
    typingUser = signal<{ isTyping: boolean; senderUsername: string } | null>(null);
    chatMessages = signal<LiveChatMessage[]>([]);

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

        this.hubConnection.on('ReceiveLiveGrade', (data: LiveGradeEvent) => {
            this.incomingLiveGrade.set(data);
        });

        this.hubConnection.on('ReceiveTypingStatus', (data: { isTyping: boolean; senderUsername: string }) => {
            this.typingUser.set(data);
        });

        this.hubConnection.on('ReceiveChatMessage', (msg: LiveChatMessage) => {
            this.chatMessages.update(msgs => [...msgs, msg]);
        });
    }

    async joinRoom(essayId: number, username: string, role: string): Promise<void> {
        await this.startConnection();
        if (this.currentEssayId && this.currentEssayId !== essayId) {
            await this.leaveRoom(this.currentEssayId);
        }

        this.currentEssayId = essayId;
        this.chatMessages.set([]);

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

    async sendLiveGrade(essayId: number, grammarScore: number, vocabScore: number, structureScore: number, feedbackNotes: string): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('SendLiveGrade', essayId, grammarScore, vocabScore, structureScore, feedbackNotes);
        }
    }

    async sendTypingStatus(essayId: number, isTyping: boolean, senderUsername: string): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('SendTypingStatus', essayId, isTyping, senderUsername);
        }
    }

    async sendChatMessage(essayId: number, message: string, senderUsername: string, senderRole: string): Promise<void> {
        if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
            await this.hubConnection.invoke('SendChatMessage', essayId, message, senderUsername, senderRole);
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
