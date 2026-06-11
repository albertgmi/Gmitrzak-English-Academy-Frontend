import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface CreditHistoryItemDto {
    id: number;
    amount: number;
    reason: string;
    date: string;
    type: 'earned' | 'spent';
}

export interface ShopItemDto {
    id: number;
    name: string;
    description: string;
    creditCost: number;
    iconEmoji?: string;
    canAfford: boolean;
}

export interface ShopPurchaseDto {
    id: number;
    itemName: string;
    iconEmoji?: string;
    creditCost: number;
    purchaseDate: string;
    status: string;
}

export interface CreditSummaryDto {
    totalCredits: number;
    creditsEarned: number;
    creditsSpent: number;
    history: CreditHistoryItemDto[];
    purchases: ShopPurchaseDto[];
}

export interface ShopPurchaseResultDto {
    success: boolean;
    message: string;
    creditsRemaining: number;
}

@Injectable({ providedIn: 'root' })
export class CreditService {
    private http = inject(HttpClient);
    private api  = `${environment.apiUrl}/api/credits`;

    getSummary() {
        return this.http.get<CreditSummaryDto>(`${this.api}/summary`);
    }

    getShopItems() {
        return this.http.get<ShopItemDto[]>(`${this.api}/shop`);
    }

    purchase(itemId: number) {
        return this.http.post<ShopPurchaseResultDto>(`${this.api}/shop/purchase/${itemId}`, {});
    }
}