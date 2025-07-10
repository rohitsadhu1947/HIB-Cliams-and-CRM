"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  assigned_to_name?: string;
}

function getSummary(renewals: Renewal[]) {
  const total = renewals.length;
  const pending = renewals.filter((r) => r.status === "pending").length;
  const overdue = renewals.filter((r) => r.status === "overdue").length;
  const converted = renewals.filter((r) => r.status === "converted").length;
  const lost = renewals.filter((r) => r.status === "lost").length;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
  return { total, pending, overdue, converted, lost, conversionRate };
}

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  try {
    return new Date(dateString).toLocaleDateString();
  } catch {
    return dateString;
  }
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

  const summary = getSummary(renewals);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Policy Renewals</h1>
      <p className="text-muted-foreground mb-6">Manage and track policy renewals</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{summary.total}</CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-yellow-600">{summary.pending}</CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">{summary.overdue}</CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Converted</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">{summary.converted}</CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Lost</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-gray-500">{summary.lost}</CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-blue-600">{summary.conversionRate}%</CardContent>
        </Card>
      </div>

      {/* Table and Actions */}
      <div className="overflow-x-auto rounded-lg shadow border bg-white">
        {loading ? (
          <div className="p-8 text-center">Loading renewals...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
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
                  <tr key={r.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-2 border font-medium">{r.policy_number}</td>
                    <td className="px-4 py-2 border">{r.policy_holder_name}</td>
                    <td className="px-4 py-2 border">{formatDate(r.renewal_date)}</td>
                    <td className="px-4 py-2 border">
                      <Badge variant={
                        r.status === "pending"
                          ? "outline"
                          : r.status === "overdue"
                          ? "destructive"
                          : r.status === "converted"
                          ? "default"
                          : r.status === "lost"
                          ? "secondary"
                          : "default"
                      }>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 border">{r.assigned_to_name ?? r.assigned_to ?? "Unassigned"}</td>
                    <td className="px-4 py-2 border">
                      <a href={`/renewals/${r.id}`} className="text-blue-600 hover:underline">View</a>
                      {/* Placeholders for future actions: Edit, Assign, Status, Activities */}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Placeholders for future features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Assignment & Status Change (Coming Soon)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">Assign renewals to users, change status, and manage workflow here.</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Activities & Status History (Coming Soon)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground">Track all activities and view status history for each renewal here.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 