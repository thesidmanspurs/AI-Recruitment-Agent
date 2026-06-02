import { useEffect, useState } from 'react';
import {
  X, Loader2, Mail, CheckCircle2, AlertCircle, Send, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { emailSettingsApi, type EmailProvider, type EmailSettings } from '../../api/emailSettingsApi';
import { ApiError } from '../../api/client';

/**
 * Email Settings modal — each recruiter configures their OWN outreach email.
 * Two providers (Gmail App Password / Resend). Outreach is blocked until a
 * test send succeeds (verifiedAt set server-side). Includes inline
 * step-by-step setup guides for both options.
 */

interface EmailSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onChanged?: (canSend: boolean) => void;
}

export function EmailSettingsModal({ open, onClose, onChanged }: EmailSettingsModalProps) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<EmailSettings | null>(null);
  const [provider, setProvider] = useState<EmailProvider>('GMAIL');
  const [fromAddress, setFromAddress] = useState('');
  const [fromName, setFromName] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  // Resend request form (admin-fulfilled) state
  const [reqName, setReqName] = useState('');
  const [reqWhatsapp, setReqWhatsapp] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqDomain, setReqDomain] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [resendRequest, setResendRequest] = useState<
    null | { status: 'PENDING' | 'CONFIGURED' | 'REJECTED'; emailAccount: string; domain: string }
  >(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    Promise.all([emailSettingsApi.get(), emailSettingsApi.myResendRequest()])
      .then(([res, reqRes]) => {
        setSettings(res.settings);
        if (res.settings.provider) setProvider(res.settings.provider);
        setFromAddress(res.settings.fromAddress ?? '');
        setFromName(res.settings.fromName ?? '');
        setResendRequest(reqRes.request);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  async function submitResendRequest() {
    setError(null);
    setNotice(null);
    if (!reqName.trim() || !reqWhatsapp.trim() || !reqEmail.trim() || !reqDomain.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmittingReq(true);
    try {
      await emailSettingsApi.submitResendRequest({
        contactName: reqName.trim(),
        whatsapp: reqWhatsapp.trim(),
        emailAccount: reqEmail.trim(),
        domain: reqDomain.trim(),
      });
      const r = await emailSettingsApi.myResendRequest();
      setResendRequest(r.request);
      setNotice('Request submitted. An admin will configure your Resend email and notify you.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit request.');
    } finally {
      setSubmittingReq(false);
    }
  }

  async function refresh() {
    const res = await emailSettingsApi.get();
    setSettings(res.settings);
    onChanged?.(res.settings.canSend);
  }

  // Persist the current form. Returns true on success. Shared by Save and
  // the test flow (which auto-saves first so the user never has to remember
  // the two-step order).
  async function saveConfig(silent = false): Promise<boolean> {
    if (!fromAddress.trim()) {
      setError('Enter the email address you will send from.');
      return false;
    }
    await emailSettingsApi.update({
      provider: 'GMAIL', // self-serve path is Gmail only; Resend is admin-fulfilled
      fromAddress: fromAddress.trim(),
      fromName: fromName.trim() || undefined,
      gmailAppPassword: gmailAppPassword.trim() || undefined,
    });
    setGmailAppPassword('');
    await refresh();
    if (!silent) setNotice('Saved. Now click “Send test email” to verify before you can send outreach.');
    return true;
  }

  async function handleSave() {
    setError(null);
    setNotice(null);
    setSaving(true);
    try {
      await saveConfig(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setError(null);
    setNotice(null);
    setTesting(true);
    try {
      // Auto-save the current form first so the test always reflects what's
      // on screen — removes the "Save then Test" gotcha.
      const ok = await saveConfig(true);
      if (!ok) return;
      const r = await emailSettingsApi.test();
      await refresh();
      setNotice(`✓ Test email sent to ${r.sentTo}. Your email is verified — you can now send outreach.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Test failed.');
    } finally {
      setTesting(false);
    }
  }

  async function handleClear() {
    if (!window.confirm('Remove your email configuration? You will not be able to send outreach until you set it up again.')) return;
    setSaving(true);
    try {
      await emailSettingsApi.clear();
      setFromAddress('');
      setFromName('');
      setGmailAppPassword('');
      setResendApiKey('');
      await refresh();
      setNotice('Configuration cleared.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Clear failed.');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Email settings</h2>
              <p className="text-xs text-gray-500 mt-0.5">Send outreach from your own email address</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
          ) : (
            <>
              {/* Status banner */}
              {settings && (
                <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-sm ${
                  settings.canSend
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  {settings.canSend ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>
                    {settings.canSend
                      ? `Verified — sending from ${settings.fromAddress}. You can send outreach.`
                      : 'Not verified yet. Outreach is blocked until you save your details and pass a test send.'}
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              {notice && (
                <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3.5 py-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-indigo-800">{notice}</p>
                </div>
              )}

              {/* Provider toggle */}
              <div className="flex gap-2">
                {(['GMAIL', 'RESEND'] as EmailProvider[]).map(p => (
                  <button key={p} onClick={() => setProvider(p)}
                    className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                      provider === p
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}>
                    {p === 'GMAIL' ? 'Gmail (App Password)' : 'Resend (custom domain)'}
                  </button>
                ))}
              </div>

              {provider === 'GMAIL' ? (
                <>
                  {/* From fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">From address *</label>
                      <input value={fromAddress} onChange={e => setFromAddress(e.target.value)}
                        placeholder="you@gmail.com"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">From name</label>
                      <input value={fromName} onChange={e => setFromName(e.target.value)}
                        placeholder="Jane Smith"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Gmail App Password {settings?.gmailConfigured && <span className="text-emerald-600 normal-case font-normal">· saved (leave blank to keep)</span>}
                    </label>
                    <input type="password" value={gmailAppPassword} onChange={e => setGmailAppPassword(e.target.value)}
                      placeholder="abcd efgh ijkl mnop"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30" />
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => setShowGuide(s => !s)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 bg-gray-50 text-sm font-semibold text-gray-800">
                      <span>How to set up Gmail App Password</span>
                      {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showGuide && (
                      <div className="px-4 py-3 text-[13px] text-gray-700 leading-relaxed"><GmailGuide /></div>
                    )}
                  </div>
                </>
              ) : (
                /* Resend = admin-fulfilled request form */
                resendRequest && resendRequest.status === 'PENDING' ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                    <p className="font-semibold mb-1">Request pending</p>
                    <p>Your Resend setup request for <strong>{resendRequest.emailAccount}</strong> ({resendRequest.domain}) has been sent to an admin. You'll be able to send outreach once they configure it.</p>
                  </div>
                ) : resendRequest && resendRequest.status === 'CONFIGURED' ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
                    <p className="font-semibold mb-1">Resend configured by admin ✓</p>
                    <p>Sending from <strong>{resendRequest.emailAccount}</strong>. You can send outreach.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-[13px] text-gray-600 -mt-1">
                      Resend is set up for you by an admin. Submit your details below and an admin will configure your sending domain.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Your name *</label>
                        <input value={reqName} onChange={e => setReqName(e.target.value)} placeholder="Jane Smith"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">WhatsApp *</label>
                        <input value={reqWhatsapp} onChange={e => setReqWhatsapp(e.target.value)} placeholder="+44 7123 456789"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Email account *</label>
                        <input value={reqEmail} onChange={e => setReqEmail(e.target.value)} placeholder="jane@company.com"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Domain *</label>
                        <input value={reqDomain} onChange={e => setReqDomain(e.target.value)} placeholder="company.com"
                          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30" />
                      </div>
                    </div>
                  </>
                )
              )}
            </>
          )}
        </div>

        <footer className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
          {provider === 'GMAIL' ? (
            <>
              <button onClick={handleClear} disabled={saving || testing}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50">
                <Trash2 className="w-3.5 h-3.5" /> Clear config
              </button>
              <div className="flex items-center gap-3">
                <button onClick={handleSave} disabled={saving || testing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </button>
                <button onClick={handleTest} disabled={saving || testing}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send test email
                </button>
              </div>
            </>
          ) : (
            /* Resend footer: submit / resubmit request, unless already pending */
            <>
              <span className="text-[11px] text-gray-500">
                {resendRequest?.status === 'CONFIGURED'
                  ? 'Configured by admin.'
                  : 'An admin will set up your Resend sending.'}
              </span>
              {resendRequest?.status !== 'PENDING' && resendRequest?.status !== 'CONFIGURED' && (
                <button onClick={submitResendRequest} disabled={submittingReq}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                  {submittingReq ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit request to admin
                </button>
              )}
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 mb-2">
      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <span>{children}</span>
    </li>
  );
}

function GmailGuide() {
  return (
    <div>
      <p className="mb-2 text-gray-600">Best for individuals. Free, ~500 emails/day from your existing Gmail.</p>
      <ol>
        <Step n={1}>Turn on <strong>2-Step Verification</strong> at <a className="text-indigo-600 underline" href="https://myaccount.google.com/security" target="_blank" rel="noreferrer">myaccount.google.com/security</a> (required for app passwords).</Step>
        <Step n={2}>Open <a className="text-indigo-600 underline" href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer">myaccount.google.com/apppasswords</a>.</Step>
        <Step n={3}>Type a name like <code className="bg-gray-100 px-1 rounded">ARIES</code> and click <strong>Create</strong>.</Step>
        <Step n={4}>Copy the 16-character password Google shows (e.g. <code className="bg-gray-100 px-1 rounded">abcd efgh ijkl mnop</code>). It's only shown once.</Step>
        <Step n={5}>Paste it into the <strong>Gmail App Password</strong> field above, set <strong>From address</strong> to your Gmail, and click <strong>Save</strong>.</Step>
        <Step n={6}>Click <strong>Send test email</strong>. When it arrives, you're verified and can send outreach.</Step>
      </ol>
      <p className="mt-1 text-[12px] text-gray-500">Your app password is encrypted on our servers and never shown again.</p>
    </div>
  );
}

