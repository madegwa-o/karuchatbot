"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

const BASE_URL = process.env.BASE_BACKEND_URL

export default function UploadPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [results, setResults] = useState<{ name: string; status: "ok" | "err"; msg: string }[]>([]);

    const accept = [".txt", ".docx"];

    const addFiles = (incoming: FileList | null) => {
        if (!incoming) return;
        const valid = Array.from(incoming).filter((f) =>
            accept.some((ext) => f.name.toLowerCase().endsWith(ext))
        );
        setFiles((prev) => {
            const names = new Set(prev.map((f) => f.name));
            return [...prev, ...valid.filter((f) => !names.has(f.name))];
        });
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
    }, []);

    const remove = (name: string) =>
        setFiles((prev) => prev.filter((f) => f.name !== name));

    const upload = async () => {
        if (!files.length) return;
        setUploading(true);
        setResults([]);

        const res: typeof results = [];
        for (const file of files) {
            try {
                const fd = new FormData();
                fd.append("file", file);
                const r = await fetch("http://localhost:8000/upload", {
                    method: "POST",
                    body: fd,
                });
                if (r.ok) {
                    res.push({ name: file.name, status: "ok", msg: "Indexed successfully" });
                } else {
                    const j = await r.json().catch(() => ({}));
                    res.push({ name: file.name, status: "err", msg: j.detail || r.statusText });
                }
            } catch (e) {
                res.push({ name: file.name, status: "err", msg: e.message });
            }
        }

        setResults(res);
        setFiles([]);
        setUploading(false);
    };

    return (
        <main className="upload-root">
            <nav className="nav">
                <span className="logo">◈ RAG STUDIO</span>
                <div className="nav-links">
                    <span className="nav-active">Upload</span>
                    <Link href="/chat" className="nav-link">Chat</Link>
                </div>
            </nav>

            <div className="page-center">
                <header className="page-header">
                    <p className="eyebrow">KNOWLEDGE BASE</p>
                    <h1 className="title">Document<br />Ingestion</h1>
                    <p className="subtitle">Add .txt or .docx files to your vector store.</p>
                </header>

                <div
                    className={`drop-zone ${dragging ? "drop-zone--over" : ""}`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => document.getElementById("file-input")?.click()}
                >
                    <input
                        id="file-input"
                        type="file"
                        multiple
                        accept=".txt,.docx"
                        style={{ display: "none" }}
                        onChange={(e) => addFiles(e.target.files)}
                    />
                    <div className="drop-icon">{dragging ? "⬇" : "⊕"}</div>
                    <p className="drop-text">Drop files here or <u>browse</u></p>
                    <p className="drop-hint">Accepted: .txt · .docx</p>
                </div>

                {files.length > 0 && (
                    <ul className="file-list">
                        {files.map((f) => (
                            <li key={f.name} className="file-item">
                                <span className="file-icon">{f.name.endsWith(".docx") ? "📄" : "📝"}</span>
                                <span className="file-name">{f.name}</span>
                                <span className="file-size">{(f.size / 1024).toFixed(1)} KB</span>
                                <button className="remove-btn" onClick={() => remove(f.name)}>✕</button>
                            </li>
                        ))}
                    </ul>
                )}

                {files.length > 0 && (
                    <button className="upload-btn" onClick={upload} disabled={uploading}>
                        {uploading ? <span className="spinner" /> : null}
                        {uploading ? "Indexing…" : `Index ${files.length} file${files.length > 1 ? "s" : ""}`}
                    </button>
                )}

                {results.length > 0 && (
                    <ul className="results">
                        {results.map((r) => (
                            <li key={r.name} className={`result-item result-item--${r.status}`}>
                                <span>{r.status === "ok" ? "✓" : "✗"}</span>
                                <strong>{r.name}</strong>
                                <span className="result-msg">{r.msg}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .upload-root {
          min-height: 100vh;
          background: #0c0c0f;
          color: #e8e6e0;
          font-family: 'Georgia', 'Times New Roman', serif;
        }

        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 3rem;
          border-bottom: 1px solid #1e1e24;
          position: sticky;
          top: 0;
          background: #0c0c0f;
          z-index: 10;
        }

        .logo {
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
          letter-spacing: 0.15em;
          color: #c8b560;
          font-weight: bold;
        }

        .nav-links { display: flex; gap: 2rem; align-items: center; }

        .nav-link {
          font-family: 'Courier New', monospace;
          font-size: 0.8rem;
          letter-spacing: 0.12em;
          color: #666;
          text-decoration: none;
          transition: color 0.2s;
        }
        .nav-link:hover { color: #c8b560; }

        .nav-active {
          font-family: 'Courier New', monospace;
          font-size: 0.8rem;
          letter-spacing: 0.12em;
          color: #c8b560;
          border-bottom: 1px solid #c8b560;
          padding-bottom: 2px;
        }

        .page-center {
          max-width: 680px;
          margin: 0 auto;
          padding: 4rem 2rem 6rem;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .eyebrow {
          font-family: 'Courier New', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          color: #c8b560;
          margin-bottom: 0.75rem;
        }

        .title {
          font-size: clamp(2.5rem, 6vw, 4rem);
          font-weight: 400;
          line-height: 1.1;
          letter-spacing: -0.02em;
          color: #f0ece0;
        }

        .subtitle {
          margin-top: 1rem;
          font-size: 1rem;
          color: #888;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
        }

        .drop-zone {
          border: 1px dashed #2e2e3a;
          border-radius: 4px;
          padding: 3.5rem 2rem;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
          background: #0f0f14;
        }

        .drop-zone:hover, .drop-zone--over {
          border-color: #c8b560;
          background: #13130f;
        }

        .drop-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #c8b560;
        }

        .drop-text {
          font-size: 1rem;
          color: #aaa;
          margin-bottom: 0.5rem;
        }

        .drop-hint {
          font-family: 'Courier New', monospace;
          font-size: 0.72rem;
          color: #555;
          letter-spacing: 0.1em;
        }

        .file-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: #111116;
          border: 1px solid #1e1e28;
          border-radius: 3px;
          font-size: 0.9rem;
        }

        .file-icon { font-size: 1rem; }

        .file-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #d8d4c8;
        }

        .file-size {
          font-family: 'Courier New', monospace;
          font-size: 0.75rem;
          color: #555;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #444;
          cursor: pointer;
          font-size: 0.8rem;
          transition: color 0.15s;
          padding: 0 0.25rem;
        }
        .remove-btn:hover { color: #e05555; }

        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          width: 100%;
          padding: 1rem;
          background: #c8b560;
          color: #0c0c0f;
          border: none;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.85rem;
          letter-spacing: 0.12em;
          font-weight: bold;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .upload-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .upload-btn:not(:disabled):hover { opacity: 0.88; }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid #0c0c0f55;
          border-top-color: #0c0c0f;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .results {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .result-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 1rem;
          border-radius: 3px;
          font-size: 0.85rem;
          font-family: 'Courier New', monospace;
        }

        .result-item--ok {
          background: #0d1a0d;
          border: 1px solid #1f3b1f;
          color: #6dbd6d;
        }

        .result-item--err {
          background: #1a0d0d;
          border: 1px solid #3b1f1f;
          color: #bd6d6d;
        }

        .result-msg { color: inherit; opacity: 0.75; margin-left: auto; font-size: 0.75rem; }
      `}</style>
        </main>
    );
}