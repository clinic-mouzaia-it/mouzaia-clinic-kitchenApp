"use client";

import React, { useState } from "react";

type User = {
  id: bigint;
  fullName: string;
  position?: string;
  level?: string;
  department?: string;
};

type AddUserModalProps = {
  onClose: () => void;
  onUserAdded: (newUser: User) => void;
};

const AddUserModal: React.FC<AddUserModalProps> = ({
  onClose,
  onUserAdded,
}) => {
  const [fullName, setFullName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(false);

  // Notification state to show success or error messages
  const [notification, setNotification] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const handleAdd = async () => {
    if (!fullName.trim()) {
      setNotification({ type: "error", message: "Full Name is required" });
      return;
    }

    setLoading(true);
    setNotification(null); // clear previous notifications

    try {
      const res = await fetch("/api/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, position, level, department }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Add user failed");

      setNotification({ type: "success", message: "User successfully created!" });

      onUserAdded(data.user);

      // Auto close modal after short delay (optional)
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setNotification({ type: "error", message: err.message || "Error adding user" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md space-y-4 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>

        {notification && (
          <div
            className={`p-2 rounded text-center ${
              notification.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="space-y-3">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full border px-4 py-2 rounded"
          />
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Position"
            className="w-full border px-4 py-2 rounded"
          />
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Department"
            className="w-full border px-4 py-2 rounded"
          />
          <select
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            className="w-full border px-4 py-2 rounded"
          >
            <option value="">Select Level</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="bg-gray-100 px-4 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
