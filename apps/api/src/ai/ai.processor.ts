import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@prisma/prisma.service';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';
import { AIJobType } from '@prisma/client';

@Processor('ai-generation')
export class AiProcessor extends WorkerHost {
  private readonly logger = new Logger(AiProcessor.name);
  private _openai?: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * Lazily create the OpenAI client. Instantiating it eagerly in the
   * constructor crashes app startup when OPENAI_API_KEY is unset, so we
   * only build it when an AI job actually runs and fail clearly if the
   * key is missing.
   */
  private get openai(): OpenAI {
    if (!this._openai) {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY');
      if (!apiKey) {
        throw new Error(
          'OPENAI_API_KEY is not configured; AI generation is unavailable.',
        );
      }
      this._openai = new OpenAI({ apiKey });
    }
    return this._openai;
  }

  async process(job: Job<any>): Promise<any> {
    const { jobId, type, input } = job.data;
    this.logger.log(`Processing AI job ${jobId} of type ${type}`);

    await this.prisma.aIJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING', startedAt: new Date() },
    });

    try {
      let result: any;

      switch (type as AIJobType) {
        case 'GENERATE_STORY':
          result = await this.generateStory(input);
          break;
        case 'GENERATE_TITLE':
          result = await this.generateTitle(input);
          break;
        case 'ENHANCE_PHOTO':
          result = await this.enhancePhoto(input);
          break;
        default:
          throw new Error(`Unsupported AI job type: ${type}`);
      }

      await this.prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          result,
          completedAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      this.logger.error(`AI job ${jobId} failed: ${error.message}`);
      await this.prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          error: error.message,
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  private async generateStory(input: any) {
    const tripData = await this.prisma.trip.findUnique({
      where: { id: input.tripId },
      include: { locations: true, media: { take: 10 } },
    });

    const prompt = `Write a ${input.length || 'medium'} travel story in a ${input.tone || 'descriptive'} tone.
Trip: ${tripData?.title}
Locations: ${tripData?.locations.map((l) => l.name).join(', ')}
Dates: ${tripData?.startDate} to ${tripData?.endDate}
${input.userPrompt ? `Focus: ${input.userPrompt}` : ''}

Generate a compelling narrative with vivid descriptions, emotions, and sensory details. Include a creative title.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.8,
    });

    const content = response.choices[0].message.content || '';
    const titleMatch = content.match(/^#?\s*(.+?)(?:\n|$)/);
    const title = titleMatch ? titleMatch[1].trim() : tripData?.title || 'Untitled Story';
    const storyBody = content.replace(/^#?\s*.+?(?:\n|$)/, '').trim();

    return {
      title,
      content: storyBody,
      wordCount: storyBody.split(/\s+/).length,
      confidence: 0.92,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  private async generateTitle(input: any) {
    const prompt = `Generate 5 creative, engaging travel titles for a trip to ${input.destinations?.join(', ')}.
${input.dates ? `Dates: ${input.dates}` : ''}
${input.theme ? `Theme: ${input.theme}` : ''}

Return as a JSON array of strings.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.9,
    });

    const content = response.choices[0].message.content || '[]';
    let titles: string[] = [];
    try {
      titles = JSON.parse(content);
    } catch {
      titles = content.split('\n').filter((l) => l.trim());
    }

    return { titles: titles.slice(0, 5) };
  }

  private async enhancePhoto(input: any) {
    // Placeholder for image enhancement via Replicate/Stable Diffusion
    this.logger.log(`Photo enhancement requested for media ${input.mediaId}`);
    return { enhanced: true, mediaId: input.mediaId, processingTime: '2.5s' };
  }
}
