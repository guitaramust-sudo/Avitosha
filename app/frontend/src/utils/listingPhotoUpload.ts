export interface FailedListingPhotoUpload {
  error: unknown
  file: File
}

export interface ListingPhotoUploadBatch {
  failedFiles: FailedListingPhotoUpload[]
  uploadedUrls: string[]
}

export const uploadListingPhotoBatch = async (
  files: File[],
  upload: (file: File) => Promise<string>,
): Promise<ListingPhotoUploadBatch> => {
  const results = await Promise.allSettled(files.map(upload))

  return results.reduce<ListingPhotoUploadBatch>(
    (batch, result, index) => {
      const file = files[index]
      if (!file) return batch

      if (result.status === 'fulfilled') {
        batch.uploadedUrls.push(result.value)
      } else {
        batch.failedFiles.push({ error: result.reason, file })
      }

      return batch
    },
    { failedFiles: [], uploadedUrls: [] },
  )
}
