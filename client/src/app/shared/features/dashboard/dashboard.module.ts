import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardComponent} from "./dashboard.component";
import {StatisticComponent} from "./statistic/statistic.component";
import {ChartModule} from "../chart/chart.module";
import {MatButtonModule} from "@angular/material/button";
import {RouterModule} from "@angular/router";
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule } from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';

@NgModule({
  declarations: [DashboardComponent,
    StatisticComponent
  ],
  imports: [
    CommonModule,
    ChartModule,
    MatButtonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  exports: [DashboardComponent,
    StatisticComponent
  ]
})
export class DashboardModule {
}
