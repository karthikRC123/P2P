import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Upload, FileUp, CheckCircle, AlertCircle } from 'lucide-react'
import { uploadPaper } from '../api/client'

export default function UploadPage() {
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  const onDrop = useCallback(async (accepted) => {
    if (accepted.length === 0) return
    const file = accepted[0]

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are accepted.')
      return
    }

    setUploading(true)
    try {
      const { data } = await uploadPaper(file)
      setResult(data)
      if (data.cached) {
        toast.success('Paper already exists! Loaded from cache.')
      } else {
        toast.success('Paper uploaded and processed successfully!')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed.'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div>
      <div className="page-header animate-in">
        <h1 className="page-title">Upload Paper</h1>
        <p className="page-subtitle">Upload a research paper PDF to begin the impact analysis pipeline</p>
      </div>

      {!result ? (
        <div className="animate-in animate-delay-1" style={{ maxWidth: 640, margin: '0 auto' }}>
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <>
                <div className="spinner" style={{ margin: '0 auto 16px' }} />
                <div className="dropzone-title">Processing paper...</div>
                <div className="dropzone-subtitle">Extracting text, computing hash, storing embeddings</div>
              </>
            ) : (
              <>
                <div className="dropzone-icon">
                  {isDragActive ? <FileUp size={48} /> : <Upload size={48} />}
                </div>
                <div className="dropzone-title">
                  {isDragActive ? 'Drop your PDF here' : 'Drag & drop your research paper'}
                </div>
                <div className="dropzone-subtitle">
                  or click to browse — PDF files only
                </div>
              </>
            )}
          </div>

          <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 16, color: 'var(--text-secondary)' }}>
              What happens after upload?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'PDF text is extracted using PyMuPDF',
                'File is hashed (SHA-256) for dedup & caching',
                'Text is chunked and stored in ChromaDB',
                'Paper is ready for AI impact scoring',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div className="glass-card" style={{ padding: 48 }}>
            <div style={{ marginBottom: 20 }}>
              {result.cached ? (
                <AlertCircle size={56} style={{ color: 'var(--accent-amber)' }} />
              ) : (
                <CheckCircle size={56} style={{ color: 'var(--accent-emerald)' }} />
              )}
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
              {result.cached ? 'Paper Already Exists' : 'Paper Uploaded!'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              {result.message}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginBottom: 32 }}>
              Hash: {result.file_hash}
            </p>
            <div className="action-bar" style={{ justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate(`/paper/${result.paper_id}`)}>
                View Paper & Score
              </button>
              <button className="btn btn-ghost" onClick={() => setResult(null)}>
                Upload Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
