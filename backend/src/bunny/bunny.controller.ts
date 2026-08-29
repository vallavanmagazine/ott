import { BadRequestException, Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BunnyService, assertVideoTable } from './bunny.service';

/**
 * Bunny Stream upload flow. Mounted under the global 'api' prefix set in main.ts,
 * so these resolve as /api/bunny/*.
 *
 * The sequence is deliberately three calls rather than one blocking upload:
 *   1. POST upload-init          → reserve a GUID + get a short-lived TUS ticket
 *   2. browser uploads to Bunny  → bytes never pass through this server
 *   3. GET  videos/:guid/status  → poll until ready (transcoding is async)
 *   4. POST videos/:guid/confirm → write the finished URLs onto the content row
 *
 * Nothing here touches DyneTube; rows keep whatever provider they already have
 * until step 4 runs against them.
 */
@Controller('bunny')
export class BunnyController {
  constructor(private readonly bunny: BunnyService) {}

  /**
   * Reserve a Bunny video and hand back TUS upload credentials.
   *
   * Only `title` is required. `table` and `recordId` are optional correlation
   * hints, echoed back when supplied: the admin UI starts an upload from an
   * "Add" modal where no row exists yet, so demanding a recordId here would
   * make the widget unusable for new content. Nothing is written to the
   * database by this call either way — an abandoned upload leaves every content
   * row exactly as it was.
   *
   * `table` is still allowlist-checked when present, so a bad value fails here
   * rather than silently travelling to confirm().
   */
  @Post('upload-init')
  async uploadInit(@Body() body: { table?: string; recordId?: string; title?: string }) {
    const title = (body?.title ?? '').trim();
    if (!title) throw new BadRequestException('title is required');

    const table = body?.table ? assertVideoTable(body.table) : undefined;
    const recordId = (body?.recordId ?? '').trim() || undefined;

    const { videoGuid } = await this.bunny.createVideo(title);
    const ticket = await this.bunny.getUploadSignature(videoGuid);
    return { ...ticket, table, recordId };
  }

  /** Poll target while Bunny transcodes. `ready` flips true when confirm can run. */
  @Get('videos/:guid/status')
  status(@Param('guid') guid: string) {
    return this.bunny.getVideoStatus(guid);
  }

  /** Write the finished Bunny URLs onto the content row. See confirmVideo(). */
  @Post('videos/:guid/confirm')
  confirm(@Param('guid') guid: string, @Body() body: { table?: string; recordId?: string }) {
    const table = assertVideoTable(body?.table);
    const recordId = (body?.recordId ?? '').trim();
    if (!recordId) throw new BadRequestException('recordId is required');
    return this.bunny.confirmVideo(table, recordId, guid);
  }

  /**
   * Remove the asset from Bunny. Intentionally does NOT clear video_url on any
   * row — unpicking which record points at this GUID is the caller's decision,
   * and silently blanking a live row from a delete call would be worse.
   */
  @Delete('videos/:guid')
  remove(@Param('guid') guid: string) {
    return this.bunny.deleteVideo(guid);
  }
}
