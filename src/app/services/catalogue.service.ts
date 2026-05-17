import { inject, Injectable, resource } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

export interface CatalogueDto {
    id: number;
    name: string;
    uploadedDate: string;
    uploadedBy: string;
    entryCount: number;
}

export interface CatalogueEntryDto {
    id: number;
    entryDate: string;
    userRef: string;
    entry: string;
    computedKey: string;
    catalogueName: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogueService {
    private apiUrl = '/api/catalogue';
    http = inject(HttpClient);

    catalogues = resource<CatalogueDto[], unknown>({
        loader: () => lastValueFrom(this.http.get<CatalogueDto[]>(this.apiUrl))
    });

    reloadCatalogues() {
        this.catalogues.reload();
    }

    uploadCatalogue(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<CatalogueDto>(`${this.apiUrl}/upload`, formData);
    }

    getEntries(filters: {
        catalogueName?: string;
        userRef?: string;
        dateFrom?: string;
        dateTo?: string;
    }) {
        let params = new HttpParams();
        if (filters.catalogueName) params = params.set('catalogueName', filters.catalogueName);
        if (filters.userRef)       params = params.set('userRef', filters.userRef);
        if (filters.dateFrom)      params = params.set('dateFrom', filters.dateFrom);
        if (filters.dateTo)        params = params.set('dateTo', filters.dateTo);
        return this.http.get<CatalogueEntryDto[]>(`${this.apiUrl}/entries`, { params });
    }

    deleteCatalogue(id: number) {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}