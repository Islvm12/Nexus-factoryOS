// src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import Button from "../components/ui/Button";
import Toggle from "../components/ui/Toggle";
import MemberRow from "../features/settings/MemberRow";
import { useAuth } from "../context/AuthContext";
import {
  LogOut,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
} from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "Admin";
  const loggedInUserId = user?.user_id || user?.id;

  const [activeTab, setActiveTab] = useState("Profile"); // Defaulted to Profile for easier testing
  const [securitySettings, setSecuritySettings] = useState({
    twoFactor: true,
    apiKey: true,
    sessionMonitoring: false,
  });

  const handleToggle = (key) =>
    setSecuritySettings((prev) => ({ ...prev, [key]: !prev[key] }));
  const navItems = [
    "Profile",
    "Team & Access",
    "Notifications",
    "Hardware",
    "Security",
    "Sessions",
  ];

  // --- TEAM MANAGEMENT STATE ---
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // --- MODAL STATES ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);

  // --- FORM STATES ---
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Operator");

  const [editForm, setEditForm] = useState({
    username: "",
    password: "",
    role: "Operator",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Helper for auth headers used across all requests
  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    "x-session-id": user?.session_id,
  });

  // --- API: FETCH USERS & ROLES ---
  const fetchTeamMembers = async () => {
    setIsLoadingMembers(true);
    setApiError(null);

    try {
      const listResponse = await fetch("/api/users", {
        headers: { "x-session-id": user?.session_id },
      });

      if (listResponse.status === 401) return logout();
      if (!listResponse.ok)
        throw new Error(`Failed to load users: ${listResponse.status}`);

      const baseUsers = await listResponse.json();

      const detailedMembers = baseUsers.map((u) => ({
        id: u.user_id,
        name: u.username,
        role: u.user_role || "Viewer",
      }));

      setTeamMembers(detailedMembers);
    } catch (error) {
      console.error("Fetch Users Error:", error);
      setApiError(error.message);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [user?.session_id]);

  // --- TRIGGER CUSTOM MODALS ---
  const promptDeleteUser = (id, name) => {
    setUserToDelete({ id, name });
  };

  const promptEditUser = (member) => {
    setUserToEdit({ ...member, isSelfEdit: false });
    setEditForm({
      username: member.name,
      password: "",
      role: member.role || "Operator",
    });
    setIsEditModalOpen(true);
  };

  // NEW: Trigger Edit Modal specifically for the logged-in user
  const promptEditSelf = () => {
    setUserToEdit({
      id: loggedInUserId,
      name: user?.username,
      role: user?.role,
      isSelfEdit: true, // Flag to hide the role selection dropdown
    });
    setEditForm({
      username: user?.username || "",
      password: "",
      role: user?.role || "Admin",
    });
    setIsEditModalOpen(true);
    setApiError(null);
  };

  // --- API: CONFIRM DELETE USER ---
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeletingId(userToDelete.id);
    setIsProcessing(true);
    setApiError(null);

    try {
      const response = await fetch(`/api/delete-user/${userToDelete.id}`, {
        method: "DELETE",
        headers: { "x-session-id": user?.session_id },
      });

      if (response.status === 401) return logout();
      if (!response.ok)
        throw new Error(`Failed to delete user: ${response.status}`);

      setTeamMembers((prev) => prev.filter((m) => m.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsDeletingId(null);
      setIsProcessing(false);
    }
  };

  // --- API: CREATE USER ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setApiError(null);

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          user_role: newRole,
        }),
      });

      if (response.status === 401) return logout();
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.detail || `Failed to create user: ${response.status}`,
        );
      }

      await fetchTeamMembers();

      setNewUsername("");
      setNewPassword("");
      setNewRole("Operator");
      setIsCreateModalOpen(false);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- API: EDIT USER ---
  const handleEditUser = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setApiError(null);

    let errors = [];
    let updatedSomething = false;

    try {
      // 1. Update Username if changed
      if (editForm.username && editForm.username !== userToEdit.name) {
        const res = await fetch(`/api/edit-username/${userToEdit.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ new_username: editForm.username }),
        });
        if (res.status === 401) return logout();
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          errors.push(`Username failed: ${errData.detail || res.statusText}`);
        } else {
          updatedSomething = true;
        }
      }

      // 2. Update Password if provided
      if (editForm.password && editForm.password.trim() !== "") {
        const res = await fetch(`/api/edit-password/${userToEdit.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ new_password: editForm.password }),
        });
        if (res.status === 401) return logout();
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          errors.push(`Password failed: ${errData.detail || res.statusText}`);
        } else {
          updatedSomething = true;
        }
      }

      // 3. Update Role if changed (ONLY if not editing oneself)
      if (
        !userToEdit.isSelfEdit &&
        editForm.role &&
        editForm.role !== userToEdit.role
      ) {
        const res = await fetch(`/api/edit-role/${userToEdit.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ new_role: editForm.role }),
        });
        if (res.status === 401) return logout();
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          errors.push(`Role failed: ${errData.detail || res.statusText}`);
        } else {
          updatedSomething = true;
        }
      }

      if (errors.length > 0) {
        throw new Error(errors.join(" | "));
      }

      if (!updatedSomething && errors.length === 0) {
        setIsEditModalOpen(false);
        setUserToEdit(null);
        return;
      }

      // If you changed your own username successfully, update localStorage and reload to apply the new context across the app
      if (userToEdit.isSelfEdit && editForm.username !== userToEdit.name) {
        const savedUser = JSON.parse(
          localStorage.getItem("nexus-user") || "{}",
        );
        savedUser.username = editForm.username;
        localStorage.setItem("nexus-user", JSON.stringify(savedUser));
        window.location.reload();
      } else {
        await fetchTeamMembers();
        setIsEditModalOpen(false);
        setUserToEdit(null);
      }
    } catch (error) {
      setApiError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 relative">
      {/* PAGE HEADER */}
      <div className="mb-6">
        <div className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1 font-semibold">
          Administration
        </div>
        <h1 className="text-[22px] font-semibold text-[var(--text-primary)] tracking-tight">
          Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5">
        {/* Left Navigation Sidebar */}
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] py-2 h-fit shadow-sm">
          {navItems.map((item) => (
            <div
              key={item}
              onClick={() => setActiveTab(item)}
              className={`px-4 py-2 text-[12px] font-medium cursor-pointer border-l-2 transition-all ${activeTab === item ? "text-[var(--blue)] border-l-[var(--blue)] bg-[var(--blue-bg)]" : "text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg3)] hover:text-[var(--text-primary)]"}`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Right Content Area */}
        <div>
          {/* ================= PROFILE TAB ================= */}
          {activeTab === "Profile" && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-[11px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-3 pb-2 border-b border-[var(--border)] font-semibold">
                Operator Profile
              </div>
              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-[var(--blue-dim)] border-2 border-[var(--blue)] flex items-center justify-center text-[var(--blue)] text-2xl font-[var(--font-mono)] font-bold shrink-0">
                  {user?.username
                    ? user.username.substring(0, 2).toUpperCase()
                    : "OP"}
                </div>
                <div className="flex-1 text-center sm:text-left w-full">
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-1 capitalize">
                    {user?.username || "Unknown User"}
                  </h2>
                  <div className="inline-block px-2.5 py-1 rounded border bg-[var(--blue-bg)] border-[var(--blue-dim)] text-[var(--blue)] text-[11px] font-[var(--font-mono)] font-semibold mb-5">
                    {user?.role || "No Role Assigned"}
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--border)] flex justify-center sm:justify-start gap-3">
                    {isAdmin && (
                      <Button variant="default" onClick={promptEditSelf}>
                        <Edit2 className="w-4 h-4 mr-1" /> Edit Profile
                      </Button>
                    )}
                    <Button
                      variant="default"
                      onClick={logout}
                      className="text-[var(--coral)] hover:text-[var(--coral)] hover:bg-[var(--coral-bg)] hover:border-[var(--coral-dim)]"
                    >
                      <LogOut className="w-4 h-4 mr-1" /> Terminate Session
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TEAM & ACCESS TAB ================= */}
          {activeTab === "Team & Access" && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-end mb-3 pb-2 border-b border-[var(--border)]">
                <div className="text-[11px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase font-semibold">
                  Team Access Control
                </div>
                {isAdmin && (
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Create User
                  </Button>
                )}
              </div>

              {apiError &&
                !isCreateModalOpen &&
                !isEditModalOpen &&
                !userToDelete && (
                  <div className="mb-4 p-3 bg-[var(--coral-bg)] border border-[var(--coral-dim)] rounded-[var(--radius-sm)] text-[12px] text-[var(--coral)] font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {apiError}
                  </div>
                )}

              <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] shadow-sm min-h-[100px] relative">
                {isLoadingMembers ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--text-muted)] gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[10px] font-[var(--font-mono)]">
                      Fetching Roles...
                    </span>
                  </div>
                ) : (
                  <>
                    {teamMembers.map((member) => (
                      <MemberRow
                        key={member.id}
                        id={member.id}
                        name={member.name}
                        role={member.role}
                        isAdmin={isAdmin}
                        isSelf={member.id === loggedInUserId}
                        onDelete={promptDeleteUser}
                        onEdit={() => promptEditUser(member)}
                        isDeleting={isDeletingId === member.id}
                      />
                    ))}
                    {teamMembers.length === 0 && (
                      <div className="p-6 text-center text-[12px] text-[var(--text-muted)] italic">
                        No users found.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ================= SECURITY TAB ================= */}
          {activeTab === "Security" && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-[11px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-3 pb-2 border-b border-[var(--border)] font-semibold">
                Security Options
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                <div>
                  <div className="text-[13px] font-semibold text-[var(--text-primary)]">
                    Two-factor authentication
                  </div>
                  <div className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                    Require 2FA for all admin accounts
                  </div>
                </div>
                <Toggle
                  isOn={securitySettings.twoFactor}
                  onToggle={() => handleToggle("twoFactor")}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: CREATE USER ================= */}
      {isCreateModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg3)]">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                Create New User
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {apiError && (
                <div className="p-2.5 bg-[var(--coral-bg)] border border-[var(--coral-dim)] rounded-[var(--radius-sm)] text-[11px] text-[var(--coral)] font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {apiError}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1.5 font-semibold">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg0)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                  placeholder="e.g. operator_john"
                />
              </div>
              <div>
                <label className="block text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1.5 font-semibold">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg0)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1.5 font-semibold">
                  System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg0)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] transition-colors cursor-pointer"
                >
                  <option value="Operator">Operator</option>
                  <option value="AI Specialist">AI Specialist</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="default"
                  className="flex-1"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER ================= */}
      {isEditModalOpen && isAdmin && userToEdit && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg3)]">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                {userToEdit.isSelfEdit ? "Edit Your Profile" : "Edit User"}
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              {apiError && (
                <div className="p-2.5 bg-[var(--coral-bg)] border border-[var(--coral-dim)] rounded-[var(--radius-sm)] text-[11px] text-[var(--coral)] font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {apiError}
                </div>
              )}
              <div>
                <label className="block text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1.5 font-semibold">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg0)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1.5 font-semibold flex justify-between">
                  <span>New Password</span>
                  <span className="normal-case font-normal text-[var(--text-muted)] italic">
                    (Leave blank to keep current)
                  </span>
                </label>
                <input
                  type="password"
                  minLength={4}
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[var(--bg0)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {/* Hide the role selector if the admin is editing their own profile */}
              {!userToEdit.isSelfEdit && (
                <div>
                  <label className="block text-[10px] font-[var(--font-mono)] text-[var(--text-muted)] tracking-widest uppercase mb-1.5 font-semibold">
                    System Role
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[var(--bg0)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--blue)] transition-colors cursor-pointer"
                  >
                    <option value="Operator">Operator</option>
                    <option value="AI Specialist">AI Specialist</option>
                    <option value="Viewer">Viewer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="default"
                  className="flex-1"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {userToDelete && isAdmin && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-[var(--radius)] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--coral-bg)] border border-[var(--coral-dim)] mx-auto flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-[var(--coral)]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)] mb-2">
                Delete User
              </h3>
              <p className="text-[13px] text-[var(--text-secondary)] mb-6">
                Are you sure you want to permanently remove{" "}
                <strong className="text-[var(--text-primary)]">
                  {userToDelete.name}
                </strong>
                ? This action cannot be undone.
              </p>

              {apiError && (
                <div className="mb-4 p-2.5 bg-[var(--coral-bg)] border border-[var(--coral-dim)] rounded-[var(--radius-sm)] text-[11px] text-[var(--coral)] font-medium text-left">
                  {apiError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="default"
                  className="flex-1"
                  onClick={() => setUserToDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmDeleteUser}
                  disabled={isProcessing}
                  className="flex-1 bg-[var(--coral)] text-white hover:bg-[#E11D48] border-none font-semibold shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    "Yes, Delete"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
