import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Post('create-order')
  createOrder(@Body() body: { sponsorId: string; amountRupees: number }) {
    return this.wallet.createOrder(body.sponsorId, body.amountRupees);
  }

  @Post('verify')
  verify(@Body() body: any) {
    return this.wallet.verify(body);
  }

  @Get('balance/:sponsorId')
  async balance(@Param('sponsorId') sponsorId: string) {
    return { balancePaise: await this.wallet.balancePaise(sponsorId) };
  }

  @Get('transactions/:sponsorId')
  transactions(@Param('sponsorId') sponsorId: string) {
    return this.wallet.transactions(sponsorId);
  }

  /** Section B5 — run the daily campaign deduction (call from a daily cron). */
  @Post('run-daily-deduction')
  runDailyDeduction(@Body() body: { date?: string }) {
    return this.wallet.runDailyDeduction(body?.date);
  }
}
