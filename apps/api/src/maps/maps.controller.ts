import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MapsService } from './maps.service';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Maps')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller({ path: 'maps', version: '1' })
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('trips/:tripId/route')
  @ApiOperation({ summary: 'Get calculated route for trip' })
  async getTripRoute(
    @CurrentUser('id') userId: string,
    @Param('tripId') tripId: string,
  ) {
    return this.mapsService.getTripRoute(userId, tripId);
  }

  @Get('trips/:tripId/heatmap')
  @ApiOperation({ summary: 'Get heatmap data for trip' })
  async getTripHeatmap(
    @CurrentUser('id') userId: string,
    @Param('tripId') tripId: string,
  ) {
    return this.mapsService.getTripHeatmap(userId, tripId);
  }

  @Get('geocode/forward')
  @ApiQuery({ name: 'q', required: true })
  @ApiOperation({ summary: 'Forward geocode address' })
  async forwardGeocode(@Query('q') query: string) {
    return this.mapsService.forwardGeocode(query);
  }

  @Get('geocode/reverse')
  @ApiQuery({ name: 'lat', required: true })
  @ApiQuery({ name: 'lng', required: true })
  @ApiOperation({ summary: 'Reverse geocode coordinates' })
  async reverseGeocode(@Query('lat') lat: number, @Query('lng') lng: number) {
    return this.mapsService.reverseGeocode(lat, lng);
  }

  @Get('styles')
  @ApiOperation({ summary: 'List available map styles' })
  async getMapStyles() {
    return this.mapsService.getMapStyles();
  }
}
