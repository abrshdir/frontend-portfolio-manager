import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy, Input, SimpleChanges, EventEmitter, Output } from '@angular/core';
import { createChart, LineSeries } from 'lightweight-charts';
import { RealtimeService } from '../../services/realtime.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChartService } from '../../services/chart.service';

@Component({
  selector: 'app-trading-view-chart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
      <div #chartContainer class="chart-container"></div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      height: 400px;
    }
  `]
})

export class TradingViewChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;
  public data: { time: string; value: number }[] = [];
  currentSeries: any;
  private toolSubscription!: Subscription;
  @Output() chartActivated = new EventEmitter<void>();

  constructor(
    private realTimeService: RealtimeService,
    private cdr: ChangeDetectorRef,
    private chartService: ChartService
  ) {
  }

  private isChartInitialized = false;

  ngAfterViewInit(): void {
    // Remove the initial data loading from here
    this.loadChartData('daily');
  }

  // Chart initialization moved to ngAfterViewInit
  public async loadChartData(timeframe: string): Promise<void> {
    try {
      const history = await this.realTimeService.getAptPriceHistory(timeframe);

      // Process data in correct sequence
      const formattedData = history.map((item: { time: string; value: number }) => ({
        ...item,
        time: item.time.split('T')[0] // Format first
      }));

      const uniqueData = this.removeDuplicateTimestamps(formattedData); // Remove duplicates after formatting
      const sortedData = uniqueData.sort((a, b) => a.time.localeCompare(b.time)); // Sort formatted dates

      this.data = sortedData;
      this.cdr.detectChanges();

      if (!this.isChartInitialized) {
        const chart = createChart(this.chartContainer.nativeElement, {
          width: this.chartContainer.nativeElement.clientWidth,
          height: 400,
          layout: {
            background: { color: '#1a1a1a' },
            textColor: 'rgba(255, 255, 255, 0.9)'
          },
          rightPriceScale: {
            borderColor: 'rgba(255, 255, 255, 0.1)'
          },
          grid: {
            vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        });

        this.currentSeries = chart.addSeries(LineSeries, {
          color: '#00ffff',
          lineWidth: 2
        });
        this.isChartInitialized = true;
      }

      this.currentSeries.setData(sortedData);
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  }

  private removeDuplicateTimestamps(data: { time: string; value: number }[]): typeof data {
    const seen = new Set();
    return data.filter(item => {
      const duplicate = seen.has(item.time);
      seen.add(item.time);
      return !duplicate;
    });
  }

  ngOnDestroy() {
    if (this.toolSubscription) {
      this.toolSubscription.unsubscribe();
    }
  }
}
