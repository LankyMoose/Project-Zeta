import * as Cinnabun from "cinnabun"
import { createSignal } from "cinnabun"
import { TrashIcon } from "../icons/TrashIcon"
import { IconButton } from "../icons/IconButton"
import "./MultimediaDropzone.css"

export type SelectedFile = {
  file: File
  data: string
  ts: number
  loading: boolean
  uploadUrl?: string
}

const MultimediaPreview = ({
  selectedFile,
  removeFile,
}: {
  selectedFile: SelectedFile
  removeFile: (ts: number) => void
}) => {
  return (
    <div className="mm-preview-item">
      <img src={selectedFile.data} />
      <div className="mm-preview-item-overlay">
        <IconButton
          type="button"
          onclick={() => removeFile(selectedFile.ts)}
          className="mm-preview-item-overlay-remove"
        >
          <TrashIcon color="var(--light)" />
          <small className="text-light">Remove</small>
        </IconButton>
      </div>
    </div>
  )
}

export const MultimediaDropzone = ({
  files = createSignal<SelectedFile[]>([]),
}: {
  files?: Cinnabun.Signal<SelectedFile[]>
}) => {
  const handleChange = (e: Event) => {
    const tgt = e.target as HTMLInputElement
    if (tgt.files && tgt.files.length > 0) {
      const asArray = Array.from(tgt.files)
      for (const file of asArray) {
        console.log(file, file.type)
        files.value.push({
          file,
          data: URL.createObjectURL(file),
          ts: Date.now(),
          loading: false,
        })
      }
      files.notify()
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    let didChange = false

    if (e.dataTransfer?.items) {
      const asArray = Array.from(e.dataTransfer.items)
      // Use DataTransferItemList interface to access the file(s)
      ;[...asArray].forEach((item) => {
        // If dropped items aren't files, reject them
        if (item.kind === "file") {
          const file = item.getAsFile()
          if (file) {
            files.value.push({
              file,
              data: URL.createObjectURL(file),
              ts: Date.now(),
              loading: false,
            })
            didChange = true
          }
        }
      })
    } else if (e.dataTransfer?.files) {
      const asArray = Array.from(e.dataTransfer.files)
      // Use DataTransfer interface to access the file(s)
      ;[...asArray].forEach((file) => {
        files.value.push({
          file,
          data: URL.createObjectURL(file),
          ts: Date.now(),
          loading: false,
        })
        didChange = true
      })
    }

    if (didChange) {
      files.notify()
    }
  }

  const removeFile = (ts: number) => {
    files.value = files.value.filter((file) => file.ts !== ts)
  }

  return (
    <div className="multimedia-uploader">
      <div className="mm-dropzone">
        <label htmlFor="file" ondragover={(e: Event) => e.preventDefault()} ondrop={handleDrop}>
          <input className="none" type="file" id="file" onchange={handleChange} multiple />
          <strong>Choose a file</strong>
          <span className="mm-dropzone-dragndrop">or drag it here.</span>
        </label>
      </div>
      <div
        watch={files}
        bind:visible={() => files.value.length > 0}
        bind:children
        className="mm-preview"
      >
        {() =>
          files.value.map((file) => (
            <MultimediaPreview selectedFile={file} removeFile={removeFile} />
          ))
        }
      </div>
    </div>
  )
}
