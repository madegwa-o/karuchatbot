"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    sources?: string[];
    streaming?: boolean;
}

const BASE_URL = process.env.BASE_BACKEND_URL

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const autoResize = () => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = "auto";
        ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    };

    const send = useCallback(async () => {
        const query = input.trim();
        if (!query || loading) return;

        setInput("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setLoading(true);

        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: query,
        };

        const assistantId = crypto.randomUUID();
        const assistantMsg: Message = {
            id: assistantId,
            role: "assistant",
            content: "",
            streaming: true,
        };

        setMessages((prev) => [...prev, userMsg, assistantMsg]);

        try {
            const res = await fetch(`${BASE_URL}/ask-stream`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });

            if (!res.ok || !res.body) throw new Error(res.statusText);

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let full = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                full += decoder.decode(value, { stream: true });
                const snapshot = full;
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantId ? { ...m, content: snapshot } : m
                    )
                );
            }

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId ? { ...m, streaming: false } : m
                )
            );
        } catch (e: unknown) {
            let message = "Something went wrong";

            if (e instanceof Error) {
                message = e.message;
            }

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId
                        ? { ...m, content: `Error: ${message}`, streaming: false }
                        : m
                )
            );
        }

        setLoading(false);
    }, [input, loading]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <main className="chat-root">
            <nav className="nav">
                <span className="logo">◈ RAG STUDIO</span>
                <div className="nav-links">
                    <Link href="/upload" className="nav-link">Upload</Link>
                    <span className="nav-active">Chat</span>
                </div>
            </nav>

            <div className="chat-layout">
                {messages.length === 0 && (
                    <div className="empty-state">
                        <p className="eyebrow">READY</p>
                        <h2 className="empty-title">Ask your knowledge base</h2>
                        <p className="empty-hint">Answers are grounded strictly in your uploaded documents.</p>
                    </div>
                )}

                <div className="messages">
                    {messages.map((m) => (
                        <div key={m.id} className={`msg msg--${m.role}`}>
                            <span className="msg-label">{m.role === "user" ? "YOU" : "AI"}</span>
                            <div className="msg-body">
                                <p className="msg-text">
                                    {m.content}
                                    {m.streaming && <span className="cursor">▌</span>}
                                </p>
                                {m.sources && m.sources.length > 0 && (
                                    <div className="sources">
                                        {m.sources.map((s, i) => (
                                            <span key={i} className="source-tag">{s}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                <div className="input-bar">
          <textarea
              ref={textareaRef}
              className="input-field"
              placeholder="Ask a question about your documents…"
              value={input}
              rows={1}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={onKeyDown}
              disabled={loading}
          />
                    <button
                        className="send-btn"
                        onClick={send}
                        disabled={loading || !input.trim()}
                        aria-label="Send"
                    >
                        {loading ? <span className="spinner" /> : "↑"}
                    </button>
                </div>
            </div>

            <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .chat-root {
          height: 100vh;
          display: flex;
          flex-direction: column;
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
          background: #0c0c0f;
          flex-shrink: 0;
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

        .chat-layout {
          flex: 1;
          display: flex;
          flex-direction: column;
          max-width: 760px;
          width: 100%;
          margin: 0 auto;
          padding: 0 1.5rem;
          overflow: hidden;
        }

        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding-bottom: 6rem;
        }

        .eyebrow {
          font-family: 'Courier New', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.25em;
          color: #c8b560;
          margin-bottom: 0.75rem;
        }

        .empty-title {
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 400;
          color: #f0ece0;
          margin-bottom: 0.75rem;
        }

        .empty-hint {
          font-family: 'Courier New', monospace;
          font-size: 0.82rem;
          color: #555;
          max-width: 400px;
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 2rem 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
          scrollbar-width: thin;
          scrollbar-color: #222 transparent;
        }

        .msg {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .msg--user { flex-direction: row-reverse; }

        .msg-label {
          font-family: 'Courier New', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          color: #555;
          padding-top: 0.25rem;
          min-width: 2rem;
          text-align: center;
        }

        .msg--user .msg-label { color: #c8b560; }

        .msg-body {
          max-width: 85%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .msg--user .msg-body { align-items: flex-end; }

        .msg-text {
          font-size: 0.95rem;
          line-height: 1.7;
          padding: 0.9rem 1.1rem;
          border-radius: 4px;
          white-space: pre-wrap;
        }

        .msg--user .msg-text {
          background: #13130f;
          border: 1px solid #2a270f;
          color: #e0dcc8;
        }

        .msg--assistant .msg-text {
          background: #0f0f14;
          border: 1px solid #1e1e28;
          color: #d8d4c8;
        }

        .cursor {
          display: inline-block;
          animation: blink 1s step-end infinite;
          color: #c8b560;
          margin-left: 1px;
        }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

        .sources {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        .source-tag {
          font-family: 'Courier New', monospace;
          font-size: 0.65rem;
          padding: 0.2rem 0.5rem;
          background: #1a1a22;
          border: 1px solid #2a2a36;
          border-radius: 2px;
          color: #666;
          letter-spacing: 0.05em;
        }

        .input-bar {
          display: flex;
          gap: 0.75rem;
          align-items: flex-end;
          padding: 1.25rem 0 1.75rem;
          border-top: 1px solid #1a1a22;
          flex-shrink: 0;
        }

        .input-field {
          flex: 1;
          background: #0f0f14;
          border: 1px solid #1e1e28;
          border-radius: 4px;
          color: #e8e6e0;
          font-family: 'Georgia', serif;
          font-size: 0.95rem;
          line-height: 1.6;
          padding: 0.75rem 1rem;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
          overflow-y: hidden;
        }

        .input-field:focus { border-color: #333; }
        .input-field:disabled { opacity: 0.5; }
        .input-field::placeholder { color: #444; }

        .send-btn {
          width: 42px;
          height: 42px;
          background: #c8b560;
          color: #0c0c0f;
          border: none;
          border-radius: 4px;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.2s;
          font-weight: bold;
        }

        .send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .send-btn:not(:disabled):hover { opacity: 0.85; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid #0c0c0f44;
          border-top-color: #0c0c0f;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </main>
    );
}