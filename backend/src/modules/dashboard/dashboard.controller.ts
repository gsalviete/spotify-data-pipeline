import { Controller, Get, UseGuards, Session, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';
import { TimeRange } from 'src/common/utils/term-util';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('/top/artists')
  @UseGuards(SessionAuthGuard)
  async getTopArtists(@Session() session: Record<string, any>, @Query('time_range') timeRange: TimeRange) {
    const userId = session.userId;
    return this.dashboardService.getTopArtists(userId, timeRange);
  }

  @Get('/top/tracks')
  @UseGuards(SessionAuthGuard)
  async getTopTracks(@Session() session: Record<string, any>, @Query('time_range') timeRange: TimeRange) {
    const userId = session.userId;
    return this.dashboardService.getTopTracks(userId, timeRange);
  }

  @Get('/top/genres')
  @UseGuards(SessionAuthGuard)
  async getTopGenres(@Session() session: Record<string, any>, @Query('time_range') timeRange: TimeRange) {
    const userId = session.userId;
    return this.dashboardService.getTopGenres(userId, timeRange);
  }

  @Get('/recently-played')
  @UseGuards(SessionAuthGuard)
  async getRecentlyPlayed(@Session() session: Record<string,any> ){
    const userId = session.userId
    return this.dashboardService.getRecentlyPlayed(userId);
  }
  
  @Get('/overview')
    async getOverview(@Session() session, @Query('time_range') timeRange: TimeRange) {
    return this.dashboardService.getOverview(session.userId, timeRange);
}
}
