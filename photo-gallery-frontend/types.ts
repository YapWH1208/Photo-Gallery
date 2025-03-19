export interface Photo {
  id: string
  name: string
  filepath: string
  date_added: string
  theme: string
  collection: string
  favourite: boolean
  camera_model: string
  focal_length: string
  exposure_time: string
  iso: string
  aperture: string
  preview_image: string
  status: string
}

export interface Collection {
  id: string
  name: string
  theme: string
  preview_image: string
  status: string
}

export interface Theme {
  id: string
  name: string
  preview_image: string
  status: string
}

