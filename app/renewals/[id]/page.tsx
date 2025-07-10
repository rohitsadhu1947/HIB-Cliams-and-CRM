import { sql } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function RenewalDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const renewals = await sql`
    SELECT r.*, p.policy_number, p.end_date, p.policy_type, p.status as policy_status, ph.name as policy_holder_name, u.full_name as assigned_to_name
    FROM policy_renewals r
    JOIN policies p ON r.policy_id = p.id
    JOIN policy_holders ph ON p.policy_holder_id = ph.id
    LEFT JOIN users u ON r.assigned_to = u.id
    WHERE r.id = ${id}
    LIMIT 1
  `;
  if (!renewals || renewals.length === 0) return notFound();
  const r = renewals[0];
  
  // Format dates safely
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-2">Renewal Details</h1>
      <div className="space-y-2">
        <div><b>Policy #:</b> {r.policy_number}</div>
        <div><b>Policy Holder:</b> {r.policy_holder_name}</div>
        <div><b>Renewal Date:</b> {formatDate(r.renewal_date)}</div>
        <div><b>Policy End Date:</b> {formatDate(r.end_date)}</div>
        <div><b>Status:</b> {r.status}</div>
        <div><b>Assigned To:</b> {r.assigned_to_name ?? r.assigned_to ?? "Unassigned"}</div>
        <div><b>Notes:</b> {r.renewal_notes ?? "-"}</div>
      </div>
      <a href="/renewals" className="text-blue-600 hover:underline">Back to Renewals</a>
    </div>
  );
} 