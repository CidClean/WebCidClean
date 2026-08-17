import { useEffect, useState, type ChangeEvent } from 'react'
import { getAreaPictureUrl, listAreaPictures, uploadAreaPicture } from '../../api/areas'
import type { AreaPicture } from '../../types/models'

export function AreaPictureUpload({ areaId }: { areaId: string }) {
  const [pictures, setPictures] = useState<AreaPicture[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function refresh() {
    listAreaPictures(areaId).then(setPictures)
  }

  useEffect(refresh, [areaId])

  useEffect(() => {
    pictures.forEach((pic) => {
      if (!urls[pic.id]) {
        getAreaPictureUrl(pic.storage_path).then((url) => {
          setUrls((prev) => ({ ...prev, [pic.id]: url }))
        })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pictures])

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      await uploadAreaPicture(areaId, file)
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="text-xs" />
      {uploading && <p className="text-xs text-gray-500">Uploading...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {pictures.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {pictures.map((pic) => (
            <a key={pic.id} href={urls[pic.id] ?? '#'} target="_blank" rel="noreferrer">
              {urls[pic.id] ? (
                <img src={urls[pic.id]} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
              ) : (
                <div className="w-16 h-16 rounded border border-gray-200 bg-gray-100" />
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
