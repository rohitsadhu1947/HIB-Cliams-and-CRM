"use client";
import { useState, useEffect } from "react";

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
  renewal_notes?: string;
}

export default function RenewalDetailClient({ renewal }: { renewal: Renewal }) {
  const r = renewal;
  // --- Assignment UI ---
  function AssignmentCard() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(r.assigned_to || "");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => setUsers(data.users || []));
    }, []);

    const handleAssign = async () => {
      setSaving(true);
      setMessage("");
      const res = await fetch(`/api/renewals/${r.id}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: selectedUser }),
      });
      if (res.ok) {
        setMessage("Assigned successfully!");
      } else {
        setMessage("Failed to assign");
      }
      setSaving(false);
    };

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Assignment</h2>
        <div className="mb-2">Current: <b>{r.assigned_to_name ?? r.assigned_to ?? "Unassigned"}</b></div>
        <select
          className="border rounded px-2 py-1 mb-2"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select user</option>
          {users.map((u: any) => (
            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
          ))}
        </select>
        <button
          className="ml-2 px-4 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
          onClick={handleAssign}
          disabled={saving || !selectedUser}
        >
          {saving ? "Saving..." : "Assign"}
        </button>
        {message && <div className="mt-2 text-green-600">{message}</div>}
      </div>
    );
  }

  // --- Status Change UI ---
  function StatusChangeCard() {
    const [status, setStatus] = useState(r.status || "pending");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const statusOptions = ["pending", "overdue", "converted", "lost"];

    const handleStatusChange = async () => {
      setSaving(true);
      setMessage("");
      const res = await fetch(`/api/renewals/${r.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessage("Status updated!");
      } else {
        setMessage("Failed to update status");
      }
      setSaving(false);
    };

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Status Change</h2>
        <div className="mb-2">Current: <b>{r.status}</b></div>
        <select
          className="border rounded px-2 py-1 mb-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button
          className="ml-2 px-4 py-1 bg-green-600 text-white rounded disabled:opacity-50"
          onClick={handleStatusChange}
          disabled={saving || !status}
        >
          {saving ? "Saving..." : "Update Status"}
        </button>
        {message && <div className="mt-2 text-green-600">{message}</div>}
      </div>
    );
  }

  // --- Activities UI ---
  function ActivitiesCard() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState("call");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [nextFollowUp, setNextFollowUp] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const activityTypes = ["call", "email", "meeting", "note"];

    useEffect(() => {
      fetch(`/api/renewals/${r.id}/activities`)
        .then((res) => res.json())
        .then((data) => setActivities(data.activities || []))
        .finally(() => setLoading(false));
    }, []);

    const handleAdd = async (e: any) => {
      e.preventDefault();
      setSaving(true);
      setMessage("");
      const res = await fetch(`/api/renewals/${r.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity_type: type, subject, description, next_follow_up_date: nextFollowUp }),
      });
      if (res.ok) {
        setMessage("Activity added!");
        setType("call"); setSubject(""); setDescription(""); setNextFollowUp("");
        // Refresh activities
        fetch(`/api/renewals/${r.id}/activities`)
          .then((res) => res.json())
          .then((data) => setActivities(data.activities || []));
      } else {
        setMessage("Failed to add activity");
      }
      setSaving(false);
    };

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-2">Activities</h2>
        <form className="mb-4 space-y-2" onSubmit={handleAdd}>
          <div>
            <select className="border rounded px-2 py-1" value={type} onChange={e => setType(e.target.value)}>
              {activityTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <input className="border rounded px-2 py-1 ml-2" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
          </div>
          <div>
            <textarea className="border rounded px-2 py-1 w-full" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <input type="date" className="border rounded px-2 py-1" value={nextFollowUp} onChange={e => setNextFollowUp(e.target.value)} />
            <span className="ml-2 text-sm text-muted-foreground">Next follow-up</span>
          </div>
          <button className="px-4 py-1 bg-blue-600 text-white rounded disabled:opacity-50" type="submit" disabled={saving}>{saving ? "Saving..." : "Add Activity"}</button>
          {message && <div className="mt-2 text-green-600">{message}</div>}
        </form>
        <div>
          <h3 className="font-semibold mb-2">Recent Activities</h3>
          {loading ? <div>Loading...</div> : activities.length === 0 ? <div className="text-muted-foreground">No activities yet.</div> : (
            <ul className="space-y-2">
              {activities.map((a: any) => (
                <li key={a.id} className="border rounded p-2">
                  <div className="font-medium">{a.activity_type.charAt(0).toUpperCase() + a.activity_type.slice(1)}: {a.subject}</div>
                  <div className="text-sm text-muted-foreground">{a.description}</div>
                  <div className="text-xs text-gray-500">{a.activity_date ? new Date(a.activity_date).toLocaleString() : ""}</div>
                  {a.next_follow_up_date && <div className="text-xs text-blue-600">Next: {a.next_follow_up_date}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // --- Status History UI (placeholder) ---
  function StatusHistoryCard() {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-2">Status History</h2>
        <div className="text-muted-foreground">View all status changes for this renewal. (Coming soon)</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <div className="col-span-1">
        <AssignmentCard />
        <StatusChangeCard />
      </div>
      <div className="col-span-1">
        <ActivitiesCard />
        <StatusHistoryCard />
      </div>
    </div>
  );
} 