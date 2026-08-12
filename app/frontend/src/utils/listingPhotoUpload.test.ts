import { describe, expect, it, vi } from 'vitest'

import { uploadListingPhotoBatch } from './listingPhotoUpload'

describe('uploadListingPhotoBatch', () => {
  it('keeps successful uploads when another file fails', async () => {
    const first = new File(['first'], 'first.jpg', { type: 'image/jpeg' })
    const second = new File(['second'], 'second.jpg', { type: 'image/jpeg' })
    const failure = new Error('expired form')
    const upload = vi
      .fn<(file: File) => Promise<string>>()
      .mockResolvedValueOnce('/storage/first.jpg')
      .mockRejectedValueOnce(failure)

    await expect(
      uploadListingPhotoBatch([first, second], upload),
    ).resolves.toEqual({
      failedFiles: [{ error: failure, file: second }],
      uploadedUrls: ['/storage/first.jpg'],
    })
  })
})
