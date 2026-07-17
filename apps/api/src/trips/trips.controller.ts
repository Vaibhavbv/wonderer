import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { ClerkAuthGuard } from '@common/guards/clerk-auth.guard';
import { OptionalClerkAuthGuard } from '@common/guards/optional-clerk-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Pagination } from '@common/decorators/pagination.decorator';
import { CreateTripDto, UpdateTripDto, TripListQueryDto, CreateLocationDto, UpdateLocationDto, ReorderLocationsDto } from './trips.dto';

// Guards are per-method here (not class-level) because GET /trips/:id is
// optional-auth — shared PUBLIC/UNLISTED trip links must work signed-out.
// Every new route MUST declare one of the two guards explicitly.
@ApiTags('Trips')
@ApiBearerAuth()
@Controller({ path: 'trips', version: '1' })
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  @UseGuards(ClerkAuthGuard)
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
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Create a new trip' })
  async createTrip(@CurrentUser('id') userId: string, @Body() dto: CreateTripDto) {
    return this.tripsService.createTrip(userId, dto);
  }

  @Get(':id')
  @UseGuards(OptionalClerkAuthGuard)
  @ApiOperation({ summary: 'Get trip details (public for PUBLIC/UNLISTED trips)' })
  async getTrip(@CurrentUser('id') userId: string | null, @Param('id') tripId: string) {
    return this.tripsService.getTrip(userId, tripId);
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Update trip' })
  async updateTrip(
    @CurrentUser('id') userId: string,
    @Param('id') tripId: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripsService.updateTrip(userId, tripId, dto);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete trip' })
  async deleteTrip(@CurrentUser('id') userId: string, @Param('id') tripId: string) {
    return this.tripsService.deleteTrip(userId, tripId);
  }

  @Post(':id/duplicate')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Duplicate trip' })
  async duplicateTrip(@CurrentUser('id') userId: string, @Param('id') tripId: string) {
    return this.tripsService.duplicateTrip(userId, tripId);
  }

  @Get(':id/stats')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Get trip statistics' })
  async getTripStats(@CurrentUser('id') userId: string, @Param('id') tripId: string) {
    return this.tripsService.getTripStats(userId, tripId);
  }

  @Post(':id/locations')
  @UseGuards(ClerkAuthGuard)
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
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Reorder all locations of a trip' })
  async reorderLocations(
    @CurrentUser('id') userId: string,
    @Param('id') tripId: string,
    @Body() dto: ReorderLocationsDto,
  ) {
    return this.tripsService.reorderLocations(userId, tripId, dto);
  }

  @Patch(':id/locations/:locationId')
  @UseGuards(ClerkAuthGuard)
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
  @UseGuards(ClerkAuthGuard)
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
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Like a trip' })
  async likeTrip(@CurrentUser('id') userId: string, @Param('id') tripId: string) {
    return this.tripsService.likeTrip(userId, tripId);
  }

  @Delete(':id/like')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Unlike a trip' })
  async unlikeTrip(@CurrentUser('id') userId: string, @Param('id') tripId: string) {
    return this.tripsService.unlikeTrip(userId, tripId);
  }
}
