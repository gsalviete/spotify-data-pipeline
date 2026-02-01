import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Session } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { SessionAuthGuard } from 'src/common/guards/session-auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/top/artists')
  @UseGuards(SessionAuthGuard)
  async getTopArtists(@Session() session: Record<string, any>){
    const userId = session.userId;
    return this.dashboardService.getTopArtists(userId);
  }
  
}
