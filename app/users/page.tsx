"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import EditUserModal from "../components/EditUserModal";
import AddUserModal from "../components/AddUserModal";

type User = {
  id: bigint;
  fullName: string;
  departement?: string;
  position?: string;
  level?: string;
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const usersPerPage = 5;

  // Helper component to display user info label + value
  const UserInfoItem = ({ label, value }: { label: string; value?: string }) => {
    if (!value) return null;
    return (
      <p className="text-sm text-gray-600">
        <span className="font-medium">{label}:</span> {value}
      </p>
    );
  };

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/get-all-users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch users");
      setUsers(data);
      setFilteredUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search input (by fullName)
  useEffect(() => {
    const filtered = users.filter((user) =>
      user.fullName.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [search, users]);

  // Delete user handler
  const handleDelete = async (id: bigint) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/delete-user?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setUsers((prev) => prev.filter((user) => user.id !== id));
      setDeleteMessage("User deleted successfully!");
    } catch (err: any) {
      setDeleteMessage(err.message || "Error deleting user");
    }

    setTimeout(() => setDeleteMessage(null), 3000);
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  return (
    <div className="font-sans grid grid-rows-[auto_1fr_auto] items-start justify-items-center min-h-screen p-6 sm:p-12 pb-20 gap-10 bg-gray-50">
      {/* Header */}
      <header className="flex items-center gap-4 row-start-1">
        <Image src="/Logo.png" alt="Logo" width={40} height={40} />
        <h1 className="text-2xl font-bold text-gray-800">
          La cuisine: Admin interface
        </h1>
      </header>

      {/* Main */}
      <main className="flex flex-col gap-8 row-start-2 w-full max-w-4xl">
        {/* Search & Add */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex flex-col w-full sm:w-[300px]">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Search by Full Name:
            </label>
            <input
              type="text"
              placeholder="e.g., Bellounes"
              className="border border-gray-300 px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-5 py-2 rounded shadow hover:bg-green-700 transition"
          >
            + Add New User
          </button>
        </div>

        {/* User List */}
        {loading ? (
          <p className="text-gray-600">Loading users...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : currentUsers.length === 0 ? (
          <p className="text-gray-500">No users found.</p>
        ) : (
          <>
            <ul className="space-y-4">
              {currentUsers.map((user) => (
                <li
                  key={user.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition duration-150"
                >
                  <div className="flex justify-between items-start sm:items-center gap-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-800 mb-1">
                        {user.fullName}
                      </p>
                      <UserInfoItem label="ID" value={user.id.toString()} />
                      <UserInfoItem label="Departement" value={user.departement} />
                      <UserInfoItem label="Position" value={user.position} />
                      <UserInfoItem label="Level" value={user.level} />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="group flex items-center gap-1 text-blue-500 hover:text-blue-700 transition text-sm font-medium"
                        aria-label={`Edit user ${user.fullName}`}
                      >
                        <PencilSquareIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      <button
                        onClick={() => handleDelete(user.id)}
                        className="group flex items-center gap-1 text-red-500 hover:text-red-700 transition text-sm font-medium"
                        aria-label={`Delete user ${user.fullName}`}
                      >
                        <TrashIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            <div className="flex justify-center gap-2 pt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded ${
                    currentPage === i + 1
                      ? "bg-green-500 text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center text-sm text-gray-400">
        © {new Date().getFullYear()} Mouzaia Clinic Kitchen. All rights
        reserved.
      </footer>

      {/* Modals */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={(updatedUser) =>
            setUsers((prev) =>
              prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
            )
          }
        />
      )}

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onUserAdded={(newUser) => setUsers((prev) => [newUser, ...prev])}
        />
      )}

      {/* Delete Toast */}
      {deleteMessage && (
        <div
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded shadow-lg z-50 ${
            deleteMessage.includes("Error")
              ? "bg-red-600 text-white"
              : "bg-green-600 text-white"
          }`}
          role="alert"
        >
          {deleteMessage}
        </div>
      )}
    </div>
  );
};

export default Users;
