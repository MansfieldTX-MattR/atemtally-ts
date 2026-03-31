"use client";

interface SendAllOffProps {
  loading: boolean;
  onSendAllOff: () => void;
}

export default function SendAllOff({ loading, onSendAllOff }: SendAllOffProps) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Send All Tallies Off</h2>
      <button
        onClick={onSendAllOff}
        disabled={loading}
        className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Send All Off
      </button>
    </section>
  );
}
