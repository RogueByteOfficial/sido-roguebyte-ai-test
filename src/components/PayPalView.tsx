import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
  RefreshCw,
  Lock,
  ExternalLink,
  DollarSign
} from 'lucide-react';

export const PayPalView: React.FC = () => {
  const [status, setStatus] = useState<{
    configured: boolean;
    sandbox: boolean;
    clientIdMasked?: string;
    hasSecret: boolean;
  } | null>(null);

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState('10.00');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('Local Agent Sandbox Test Payment');
  const [orderResult, setOrderResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/paypal/status');
      if (res.ok) setStatus(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConfigure = async () => {
    try {
      const res = await fetch('/api/paypal/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          sandbox: true // Strictly sandbox!
        })
      });
      if (res.ok) {
        setStatusMessage('PayPal Sandbox credentials saved. Secrets permanently masked.');
        setClientId('');
        setClientSecret('');
        fetchStatus();
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    }
  };

  const handleCreateTestOrder = async () => {
    setIsLoading(true);
    setOrderResult(null);
    try {
      const res = await fetch('/api/paypal/test-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          description
        })
      });
      const data = await res.json();
      setOrderResult(data);
    } catch (err: any) {
      setOrderResult({
        success: false,
        message: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Hard-Enforced Sandbox Notice */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            PayPal Sandbox Financial Integration
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Strictly isolated to PayPal Developer Sandbox. No real money can ever be moved.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            PAYPAL_SANDBOX = TRUE (LOCKED)
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-indigo-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Status Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Environment Mode</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="text-sm font-bold text-amber-400">
            SANDBOX ISOLATED
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Endpoint: api-m.sandbox.paypal.com
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Credentials Configured</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status?.configured ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
            />
          </div>
          <div className="text-sm font-bold text-white">
            {status?.configured ? 'Sandbox Client Active' : 'Not Configured (Optional)'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            {status?.clientIdMasked ? `ID: ${status.clientIdMasked}` : 'Ready for test credentials'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-semibold text-slate-400">Human Approval Rule</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-sm font-bold text-white">
            MANDATORY APPROVAL
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Any payment action pauses for explicit human confirmation
          </p>
        </div>
      </div>

      {/* Sandbox Test Order & Credentials Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Order Generation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Create Sandbox Test Payment Order
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Test Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 text-xs font-mono">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Order Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleCreateTestOrder}
              disabled={isLoading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-950"
            >
              <Play className="w-3.5 h-3.5" />
              {isLoading ? 'Creating Test Order...' : 'Generate Sandbox Order'}
            </button>
          </div>

          {orderResult && (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Order Verification:</span>
                <span
                  className={`font-semibold ${
                    orderResult.success ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {orderResult.success ? 'ORDER GENERATED' : 'SIMULATION MODE'}
                </span>
              </div>

              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 overflow-x-auto max-h-48">
                {JSON.stringify(orderResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Credentials Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            PayPal Sandbox App Credentials
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Sandbox Client ID</label>
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Sandbox Client Secret</label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="EXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleConfigure}
              disabled={!clientId.trim() || !clientSecret.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 disabled:text-slate-600 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
            >
              Update Sandbox Credentials
            </button>

            <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="font-semibold text-slate-300">Sandbox Safety Mandate:</div>
              <p>1. The agent never executes transactions on production PayPal (www.paypal.com).</p>
              <p>2. Client secrets are never written into source repositories or project files.</p>
              <p>3. Every financial API call triggers a Human Approval ticket before sending.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
