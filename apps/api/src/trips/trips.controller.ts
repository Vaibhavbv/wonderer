import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Pagination } from '@common/decorators/pagination.decorator';
import { CreateTripDto, UpdateTripDto, TripListQueryDto, CreateLocationDto, UpdateLocationDto, ReorderLocationsDto } from './trips.dto';

@ApiTags('Trips')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller({ path: 'trips', version: '1' })
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @ApiOperation({ summary: 'List trips with pagination' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  @ApiQuery({ name: 'privacy', required: false, enum: ['PRIVATE', 'UNLISTED', 'PUBLIC'] })
  @ApiQuery({ name: 'sort', required: false, description: 'created_at:desc, start_date:asc' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  async listTrips(
    @CurrentUser('id') userId: string,
    @Query() query: TripListQueryDto,
    @Pagination() pagination: { cursor?: string; perPage: number; sort: string },
  ) {
    return this.tripsService.listTrips(userId, query, pagination);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new trip' })
  async createTrip(@CurrentUser('id') userId: string, @Body() dto: CreateTripDto) {
    return this.tripsService.createTrip(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trip details' })
  async getTrip(@CurrentUser('id') userId: string, @Param('id') tripId: string) {
    return this.tripsService.getTrip(userId, tripId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update trip' })
  async updateTrip(
    @CurrentUser('id') userId: string,
    @Param('id') tripId: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripsService.updateTrip(userId, tripId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete trip' })
  async deleteTrip(@CurrentUser('id') userId: string, @Param('id') tripId: string) {
    return this.tripsService.deleteTrip(userId, tripId);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate trip' })
  async duplicateTrip(@CurrentUser('id') userId: string, @Param('id') tripId: string) {
    return this.tripsService.duplicateTrip(userId, tripId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get trip statistics' })
  async getTripStats(@CurrentUser('id') userId: string, @Param('id') tripId: string) {
    return this.tripsService.getTripStats(userId, tripId);
  }

  @Post(':id/locations')
  @ApiOperation({ summary: 'Add a location to a trip' })
  async addLocation(
    @CurrentUser('id') userId: string,
    @Param('id') tripId: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.tripsService.addLocation(userId, tripId, dto);
  }

  // 'order' can't be shadowed by :locationId — the param routes use
  // PATCH/DELETE while this is the only PUT under /locations.
  @Put(':id/locations/order')
  @ApiOperation({ summary: 'Reorder all locations of a trip' })
  async reorderLocations(
    @CurrentUser('id') userId: string,
    @Param('id') tripId: string,
    @Body() dto: ReorderLocationsDto,
  ) {
    return this.tripsService.reorderLocations(userId, tripId, dto);
  }

  @Patch(':id/locations/:locationId')
  @ApiOperation({ summary: 'Update a trip location' })
  async updateLocation(
    @CurrentUser('id') userId: string,
    @Param('id') tripId: string,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.tripsService.updateLocation(userId, tripId, locationId, dto);
  }

  @Delete(':id/locations/:locationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a location from a trip' })
  async removeLocation(
    @CurrentUser('id') userId: string,
    @Param('id') tripId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.tripsService.removeLocation(userId, tripId, locationId);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a trip' })
  async likeTrip(@CurrentUser('id') userId: string, @Param('id') tripId: string) {
    return this.tripsService.likeTrip(userId, tripId);
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Unlike a trip' })
  async unlikeTrip(@CurrentUser('id') userId: string, @Param('id') tripId: string) {
    return this.tripsService.unlikeTrip(userId, tripId);
  }
}
