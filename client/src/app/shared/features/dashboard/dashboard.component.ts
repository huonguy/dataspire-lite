import {AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
import {ProcessApisService} from '../../../apis/process/process.apis.service';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs';
import {CustomerLifetimeValue, Statistic} from '../../../graphql/generated/graphql';
import {map} from 'rxjs/operators';
import {CookieService} from 'ngx-cookie-service';
import {TokenService} from '../../../services/token.service';
import {environment} from '../../../../environments/environment';
import {ProcessApisMockService} from '../../../apis/process/process.apis.mock.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { string } from '@amcharts/amcharts4/core';
import { cos } from '@amcharts/amcharts4/.internal/core/utils/Math';

export interface GuestElement {
  fullName: string;
  email: string;
  type: string;
  low: number;
  mid: number;
  high: number;
}

interface Type {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="grid-container full">
      <app-statistic
        *ngIf="(statistic$ | async) as statistic"
        [totalRecord]="count$|async"
        [highValueGuest]="statistic.highValueGuest"
        [potentialGuest]="statistic.totalPotentialVipGuest"
        [totalGuest]="statistic.totalIdentifiedGuest"
      ></app-statistic>
      <div class="grid-x grid-margin-x">
        <div class="cell medium-5">
          <ng-container *ngIf="(segmentationData$ | async) as data">
            <app-pie
              [data]="data" (onChartLegendChange) = "handleChartLegendChange($event)">
            </app-pie>
          </ng-container>

        </div>
        <div class="cell medium-7">
          <ng-container *ngIf="(clv$ | async) as data">
            <app-column
              [data]="data" (onChartLegendChange) = "handleChartLegendChange($event)">
            </app-column>
          </ng-container>

        </div>
      </div>
      <div>
        <!-- Huong Uy - Filter by Type/Name -->
        <div class="filter-section">
          <div [style.display]="(filteredBy === 'name') ? 'inline' : 'none'">
            <mat-form-field appearance="outline" style="width: 350px;">
              <mat-label>Input Name</mat-label>
              <input matInput placeholder="Filter" (keyup)="applyFilter($event.target)">
            </mat-form-field>
          </div>
          <div [style.display]="(filteredBy === 'type') ? 'inline' : 'none'">
            <mat-form-field appearance="outline" style="width: 350px;">
                <mat-label>Choose Guest Type</mat-label>
                <mat-select (selectionChange)="onGuestTypeChanged($event.value)">
                  <mat-option *ngFor="let type of types" [value]="type.value">
                    {{type.viewValue}}
                  </mat-option>
                </mat-select>
            </mat-form-field>
          </div>
          <div class="filter-choosen">
            <mat-form-field appearance="outline" style="width: 150px;">
                <mat-label>Filter by:</mat-label>
                <mat-select [(value)]="filteredBy">
                  <mat-option value="name">Name</mat-option>
                  <mat-option value="type">Guest Type</mat-option>
                </mat-select>
            </mat-form-field>
          </div>
        </div>
        <!-- Huong Uy - Show guest list section -->
        <table mat-table [dataSource]="dataSource" class="mat-elevation-z8">
          <ng-container matColumnDef="fullName">
            <th mat-header-cell *matHeaderCellDef> FullName </th>
            <td mat-cell *matCellDef="let element"> {{element.fullName}} </td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef> Email </th>
            <td mat-cell *matCellDef="let element"> {{element.email}} </td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef> Type </th>
            <td mat-cell *matCellDef="let element"> {{element.type}} </td>
          </ng-container>

          <ng-container matColumnDef="low">
            <th mat-header-cell *matHeaderCellDef> Low </th>
            <td mat-cell *matCellDef="let element"> {{element.low}} </td>
          </ng-container>

          <ng-container matColumnDef="mid">
            <th mat-header-cell *matHeaderCellDef> Mid </th>
            <td mat-cell *matCellDef="let element"> {{element.mid}} </td>
          </ng-container>

          <ng-container matColumnDef="high">
            <th mat-header-cell *matHeaderCellDef> High </th>
            <td mat-cell *matCellDef="let element"> {{element.high}} </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons></mat-paginator>
      </div>
      <div class="flex-container align-justify margin-top-2">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ProcessApisService,
      useClass: environment.production ? ProcessApisService : ProcessApisMockService,
    },
  ]
})

export class DashboardComponent implements OnInit, AfterViewInit {

  statistic$: Observable<Statistic>;
  count$: Observable<number>;
  segmentationData$: Observable<Array<{ name: string, value: number }>>;
  clv$: Observable<Array<{
    category: string;
    first: number;
    second: number;
  }>>;
  customerLifetimeValueList$: Observable<Array<{ fullName: string, email: string, type: string, low: number, mid: number, high: number }>>;
  displayedColumns: string[] = ['fullName', 'email', 'type', 'low', 'mid', 'high'];
  dataSource: MatTableDataSource<GuestElement>;
  guestsEle: GuestElement[] = [];

  types: Type[] = [
    { value: '1st-Time Guest', viewValue: '1st-Time Guest' },
    { value: 'Returning Guest', viewValue: 'Returning Guest' },
  ];

  filteredBy: string  = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private processApiService: ProcessApisService,
    private cookieService: CookieService,
    private tokenService: TokenService,
    private route: ActivatedRoute,
    private changeDetectorRefs: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    const processId = this.route.snapshot.queryParams?.id;
    this.count$ = this.processApiService.getTotalRecordCount({filter: {processId}});
    this.statistic$ = this.processApiService.getStatistic({filter: {processId}});
    this.segmentationData$ = this.processApiService.getIdentifiedGuestSegmentation({filter: {processId}})
      .pipe(map(x => x?.map(i => ({name: i?.segment, value: i?.value}))));

    this.clv$ = this.processApiService.getClvClassList({filter: {processId}})
      .pipe(map(x => x?.map(i => ({
          category: i?.name,
          first: i?.typeList?.find(e => e?.name === '1st-Time Guest')?.value,
          second: i?.typeList?.find(e => e?.name === 'Returning Guest')?.value,
        }))),
      );

      this.customerLifetimeValueList$ = this.processApiService.getCustomerLifetimeValueList({filter: {processId}})
      .pipe(map(x => x?.map(i => ({
          fullName: i?.firstName + ' ' +  i?.lastName,
          email: i?.email,
          low: i?.low,
          mid: i?.mid,
          high: i?.high,
          type: i?.type
      }))));

      this.customerLifetimeValueList$.subscribe(val => {
        this.guestsEle = [...[], ...val];
        this.dataSource = new MatTableDataSource<GuestElement>(val);
      });
  }

  ngAfterViewInit(): void{
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(filterValue:any){
    this.dataSource.filter = filterValue.value.trim().toLowerCase();
  }

  handleChartLegendChange(value: string[]){
    const filteredData = this.guestsEle.filter((ds: GuestElement) => {
      return value.indexOf(ds.type) !== -1;
    })
    this.dataSource = new MatTableDataSource<GuestElement>(filteredData);
    this.refreshPaginator();
    this.changeDetectorRefs.detectChanges();
  }

  onGuestTypeChanged(value: string){
    const filteredData = this.guestsEle.filter((ds: GuestElement) => {
      return value === ds.type;
    })
    this.dataSource = new MatTableDataSource<GuestElement>(filteredData);
    this.refreshPaginator();
    this.changeDetectorRefs.detectChanges();
  }

  refreshPaginator(){
    this.paginator.pageIndex = 0;
    this.dataSource.paginator = this.paginator;
  }

}
