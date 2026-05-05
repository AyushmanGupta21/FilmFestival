'use client';

import { useEffect, useRef, useState } from 'react';

const SCAN_ENDPOINT = '/api/scan';

const EMPTY = {
  type: '',
  title: '',
  name: '',
  studentId: '',
  department: '',
  college: '',
  message: '',
};

export default function ScannerPage() {
  const scannerRef     = useRef(null);
  const scanningRef    = useRef(false);
  const lastScanRef    = useRef('');
  const lastScanTimeRef = useRef(0);

  const [counts, setCounts]         = useState({ success: 0, duplicate: 0, error: 0 });
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(EMPTY);
  const [showNext, setShowNext]     = useState(false);
  const [logs, setLogs]             = useState([]);

  /* ── helpers ───────────────────────────────────────────── */

  const addLog = (type, name, id) => {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    setLogs((prev) => [{ type, name: name || '—', id: id || '', time }, ...prev]);
  };

  /* ── scanner control ────────────────────────────────────── */

  const stopScanning = async () => {
    if (!scannerRef.current || !scanningRef.current) return;
    scanningRef.current = false;
    try { await scannerRef.current.stop(); } catch { /* ignore */ }
  };

  const startScanning = async () => {
    if (!scannerRef.current || scanningRef.current) return;
    scanningRef.current = true;
    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 190, height: 190 } },
        onDecode,
        () => { /* silent scan errors */ }
      );
    } catch {
      scanningRef.current = false;
      setResult({ ...EMPTY, type: 'error', title: 'Camera Error', name: 'Allow camera access and reload the page.' });
      setShowNext(true);
    }
  };

  /* ── QR decode ──────────────────────────────────────────── */

  const onDecode = async (raw) => {
    const now = Date.now();
    if (raw === lastScanRef.current && now - lastScanTimeRef.current < 4000) return;
    lastScanRef.current     = raw;
    lastScanTimeRef.current = now;

    await stopScanning();
    setLoading(true);
    setResult(EMPTY);
    setShowNext(false);

    try {
      const res  = await fetch(`${SCAN_ENDPOINT}?id=${encodeURIComponent(raw)}`);
      const data = await res.json();
      handleResponse(data);
    } catch (err) {
      handleError(err);
    }
  };

  /* ── server response ────────────────────────────────────── */

  const handleResponse = (data) => {
    setLoading(false);

    if (data.status === 'success') {
      setResult({
        type:       'success',
        title:      'Entry Granted',
        name:       data.name        || '',
        studentId:  data.studentId   || '',
        department: data.department  || '',
        college:    data.college     || '',
        message:    '',
      });
      setCounts((p) => ({ ...p, success: p.success + 1 }));
      addLog('success', data.name, data.studentId);
      if (navigator.vibrate) navigator.vibrate([80]);

    } else if (data.status === 'duplicate') {
      setResult({
        type:       'duplicate',
        title:      'Already Admitted',
        name:       data.name        || '',
        studentId:  data.studentId   || '',
        department: data.department  || '',
        college:    data.college     || '',
        message:    '',
      });
      setCounts((p) => ({ ...p, duplicate: p.duplicate + 1 }));
      addLog('duplicate', data.name, data.studentId);
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

    } else if (data.status === 'not_found') {
      setResult({
        ...EMPTY,
        type:    'error',
        title:   'Not Registered',
        name:    data.message || 'ID not found in the database.',
      });
      setCounts((p) => ({ ...p, error: p.error + 1 }));
      addLog('error', 'Not found', data.studentId);
      if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

    } else {
      setResult({
        ...EMPTY,
        type:  'error',
        title: 'Error',
        name:  data.message || 'Something went wrong.',
      });
      setCounts((p) => ({ ...p, error: p.error + 1 }));
      addLog('error', 'Error', '');
    }

    setShowNext(true);
  };

  const handleError = () => {
    setLoading(false);
    setResult({ ...EMPTY, type: 'error', title: 'Connection Error', name: 'Could not reach the server. Check your connection.' });
    setCounts((p) => ({ ...p, error: p.error + 1 }));
    addLog('error', 'Connection Error', '');
    setShowNext(true);
  };

  /* ── resume ─────────────────────────────────────────────── */

  const resumeScanning = async () => {
    setResult(EMPTY);
    setShowNext(false);
    lastScanRef.current = '';
    await startScanning();
  };

  /* ── init ───────────────────────────────────────────────── */

  useEffect(() => {
    let alive = true;
    const init = async () => {
      const { Html5Qrcode } = await import('html5-qrcode');
      if (!alive) return;
      scannerRef.current = new Html5Qrcode('reader');
      await startScanning();
    };
    init().catch(() => {
      setResult({ ...EMPTY, type: 'error', title: 'Load Error', name: 'Scanner library failed to load.' });
      setShowNext(false);
    });
    return () => {
      alive = false;
      stopScanning().finally(() => { scannerRef.current = null; });
    };
  }, []); // eslint-disable-line

  /* ── render ─────────────────────────────────────────────── */

  const totalScans = counts.success + counts.duplicate + counts.error;

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <span className="header-title">
            <em>Film</em> Festival 2026
          </span>
          <span className="header-sub">Gate Entry Scanner</span>
        </div>
        <div className="live-pill">
          <span className="live-dot" />
          Live
        </div>
      </header>

      <main>
        {/* Camera */}
        <section className="scanner-section">
          <div className="scanner-box">
            <div id="reader" />
            <div className="vf-overlay" aria-hidden="true">
              <div className="vf-frame">
                <span className="vf-tl" />
                <span className="vf-tr" />
                <span className="vf-br" />
                <span className="vf-bl" />
                <div className="vf-scanline" />
              </div>
            </div>
            <p className="vf-hint">Point camera at student&apos;s QR code</p>
          </div>
        </section>

        {/* Loading */}
        <div className={`loading-bar${loading ? ' show' : ''}`} aria-live="polite">
          <div className="spinner" />
          Verifying attendance…
        </div>

        {/* Result card */}
        {result.type && (
          <div className={`result-card ${result.type} visible`} role="status" aria-live="assertive">
            <div className="result-top">
              <div className="result-badge">
                {result.type === 'success'   && '✓'}
                {result.type === 'duplicate' && '⚠'}
                {result.type === 'error'     && '✕'}
              </div>
              <div className="result-info">
                <div className="result-label">{result.title}</div>
                <div className="result-name">{result.name}</div>
              </div>
            </div>

            {(result.studentId || result.department || result.college) && (
              <div className="result-details">
                {result.studentId && (
                  <div className="detail-row">
                    <span className="detail-key">Student ID</span>
                    <span className="detail-val">{result.studentId}</span>
                  </div>
                )}
                {result.department && (
                  <div className="detail-row">
                    <span className="detail-key">Department</span>
                    <span className="detail-val">{result.department}</span>
                  </div>
                )}
                {result.college && (
                  <div className="detail-row">
                    <span className="detail-key">College</span>
                    <span className="detail-val">{result.college}</span>
                  </div>
                )}
              </div>
            )}

            {showNext && (
              <div className="result-footer">
                <button className="btn-next" onClick={resumeScanning}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Scan Next Student
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="stats-row" aria-label="Scan statistics">
          <div className="stat-box s">
            <div className="stat-n">{counts.success}</div>
            <div className="stat-l">Admitted</div>
          </div>
          <div className="stat-box d">
            <div className="stat-n">{counts.duplicate}</div>
            <div className="stat-l">Duplicate</div>
          </div>
          <div className="stat-box e">
            <div className="stat-n">{counts.error}</div>
            <div className="stat-l">Rejected</div>
          </div>
        </div>

        {/* Activity log */}
        <section aria-label="Scan activity log">
          <div className="log-header">
            <span className="log-title">Activity</span>
            <span className="log-badge">{totalScans} scan{totalScans !== 1 ? 's' : ''}</span>
          </div>
          <div className="log-list">
            {logs.length === 0 ? (
              <div className="log-empty">No scans recorded yet</div>
            ) : (
              logs.map((l, i) => (
                <div className={`log-item ${l.type}`} key={`${l.time}-${i}`}>
                  <span className="log-pip" />
                  <div className="log-info">
                    <div className="log-n">{l.name}</div>
                    {l.id && <div className="log-sid">{l.id}</div>}
                  </div>
                  <span className="log-t">{l.time}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}