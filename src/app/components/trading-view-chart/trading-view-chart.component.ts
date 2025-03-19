import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { createChart, LineSeries } from 'lightweight-charts';

@Component({
  selector: 'app-trading-view-chart',
  template: `<div #chartContainer class="chart-container"></div>`,
  styles: [`
    .chart-container {
      width: 100%;
      height: 400px;
    }
  `]
})
export class TradingViewChartComponent implements AfterViewInit {
  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef;

  ngAfterViewInit(): void {
    // Create the chart
    const chart = createChart(this.chartContainer.nativeElement, {
      width: this.chartContainer.nativeElement.clientWidth,
      height: 400,
    });

    // Add a line series
    const lineSeries = chart.addSeries(LineSeries); // Use addSeries with LineSeries

    // Define the data
    const data = [
      { time: '2024-01-01', value: 10 },
      { time: '2024-01-02', value: 15 },
      { time: '2024-01-03', value: 12 },
      { time: '2024-01-04', value: 18 },
      { time: '2024-01-05', value: 14 },
    ];

    // Set the data for the line series
    lineSeries.setData(data);
  }
}
