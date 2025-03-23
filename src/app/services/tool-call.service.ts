import { Injectable } from '@angular/core';
import { RealtimeService } from './realtime.service';
import { ChartService } from './chart.service';

type ToolHandler = (args: any) => Promise<any>;

@Injectable({ providedIn: 'root' })
export class ToolCallService {
  private toolRegistry = new Map<string, ToolHandler>();

  constructor(
    private realtimeService: RealtimeService,
    private chartService: ChartService
  ) {
    this.registerCoreTools();
  }

  private registerCoreTools() {
    this.registerTool('AptosGetTokenPriceTool', async (args) => {
      const history = await this.realtimeService.getAptPriceHistory(args.timeframe);
      this.chartService.updateChart(history);
      return { status: 'chart_updated', timeframe: args.timeframe };
    });
  }

  registerTool(name: string, handler: ToolHandler) {
    this.toolRegistry.set(name, handler);
  }

}