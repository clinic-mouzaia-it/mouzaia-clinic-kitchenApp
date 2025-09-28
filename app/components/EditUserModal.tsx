"use client";

import React, { useState } from "react";

type User = {
  id: bigint;
  fullName: string;
  departement?: string;
  position?: string;
  level?: string;
};

type EditUserModalProps = {
  user: User;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
};

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,
  onUserUpdated,
}) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [departement, setDepartement] = useState(user.departement || "");
  const [position, setPosition] = useState(user.position || "");
  const [level, setLevel] = useState(user.level || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      alert("Full Name is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/update-user`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id.toString(),
          fullName,
          departement: departement.trim() === "" ? null : departement,
          position: position.trim(),
          level: level ? parseInt(level, 10) : null, // 👈 ensure number for Prisma
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      onUserUpdated({
        ...user,
        fullName,
        departement,
        position,
        level,
      });

      onClose();
    } catch (err: any) {
      alert(err.message || "Error updating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md space-y-4 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Edit User</h2>

        <div className="space-y-3">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full border px-4 py-2 rounded"
          />

          <input
            value={departement}
            onChange={(e) => setDepartement(e.target.value)}
            placeholder="Departement"
            className="w-full border px-4 py-2 rounded"
          />

          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Position"
            className="w-full border px-4 py-2 rounded"
          />

          <select
            value={level ?? ""}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full border px-4 py-2 rounded"
          >
            <option value="">Select Level</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="bg-gray-100 px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
