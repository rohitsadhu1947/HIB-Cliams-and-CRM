"use client";
console.log("Rendering RenewalsPage");

import { useEffect, useState } from "react";

interface Renewal {
  id: number;
  policy_id: number;
  renewal_date: string;
  status: string;
  assigned_to?: number;
  renewal_premium?: string;
  original_premium?: string;
  policy_number: string;
  end_date: string;
  policy_type: string;
  policy_status: string;
  policy_holder_name: string;
}

export default function RenewalsPage() {
  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRenewals = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/renewals");
        if (!res.ok) throw new Error("Failed to fetch renewals");
        const data = await res.json();
        setRenewals(data.renewals || []);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchRenewals();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Policy Renewals</h1>
      <p className="text-muted-foreground mb-4">Manage and track policy renewals</p>
      {loading ? (
        <div>Loading renewals...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Policy #</th>
                <th className="px-4 py-2 border">Policy Holder</th>
                <th className="px-4 py-2 border">Renewal Date</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Assigned To</th>
                <th className="px-4 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {renewals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">No renewals found.</td>
                </tr>
              ) : (
                renewals.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-4 py-2 border">{r.policy_number}</td>
                    <td className="px-4 py-2 border">{r.policy_holder_name}</td>
                    <td className="px-4 py-2 border">{r.renewal_date}</td>
                    <td className="px-4 py-2 border">{r.status}</td>
                    <td className="px-4 py-2 border">{r.assigned_to ?? "Unassigned"}</td>
                    <td className="px-4 py-2 border">
                      {/* Placeholder for actions: View, Edit, Mark as Renewed, etc. */}
                      <button className="text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 