import { getPresignedUrl, updateMedia, uploadToPresignedUrl } from "./trip-api";

export interface UploadResult {
  uploadedIds: string[];
  failedCount: number;
}

// Shared photo upload pipeline: presign → PUT to S3 → attach to a location.
// Used by both the create-trip flow and the trip editor. Failures are
// per-file — one bad photo doesn't sink the batch.
export async function uploadTripPhotos(
  token: string,
  tripId: string,
  files: File[],
  locationId?: string,
): Promise<UploadResult> {
  const uploadedIds: string[] = [];
  let failedCount = 0;

  for (const file of files) {
    try {
      const presigned = await getPresignedUrl(token, {
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
        tripId,
      });
      await uploadToPresignedUrl(presigned.uploadUrl, file);
      if (locationId) {
        await updateMedia(token, presigned.mediaId, { locationId });
      }
      uploadedIds.push(presigned.mediaId);
    } catch (err) {
      console.error("Photo upload failed", err);
      failedCount += 1;
    }
  }

  return { uploadedIds, failedCount };
}
