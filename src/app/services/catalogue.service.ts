import { inject, Injectable, resource } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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
    translatedEntry?: string;
}
export interface CatalogueFilters {
  catalogueName?: string;
  userRef?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogueService {
    private apiUrl = `${environment.apiUrl}/api/catalogue`;
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
        return this.http.post<CatalogueDto>(`${`${this.apiUrl}/upload`}`, formData);
    }

    getEntries(filters: CatalogueFilters): Observable<CatalogueEntryDto[]> {
      let params = new HttpParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
  
      return this.http.get<CatalogueEntryDto[]>(`${this.apiUrl}/entries`, { params });
    }

    deleteCatalogue(id: number) {
        return this.http.delete(`${`${this.apiUrl}/${id}`}`);
    }

    updateEntry(id: number, body: { translatedEntry?: string }): Observable<void> {
      return this.http.put<void>(`${`${this.apiUrl}/entries/${id}`}`, body);
    }
}