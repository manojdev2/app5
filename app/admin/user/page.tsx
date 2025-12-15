"use client";

import { useEffect, useState } from "react";
import { getAllUsers, addCreditsToUser, updateUserCredits, deleteUser, getUserById, createUser, getUserPlans, type UserData } from "@/server/admin/users";
import { Plus, Edit, Trash2, Loader2, Search, Eye, UserPlus, ChevronLeft, ChevronRight, FileText, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const adminEnabled = process.env.NEXT_PUBLIC_ADMIN_ENABLED === "true";
const ITEMS_PER_PAGE = 10;

export default function AdminUserPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userPlans, setUserPlans] = useState<Array<{
    _id: string;
    destination: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
  }>>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [showAddCreditsModal, setShowAddCreditsModal] = useState(false);
  const [showEditCreditsModal, setShowEditCreditsModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState("");
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    initialCredits: "0",
  });
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  // Password validation helper
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("One lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("One uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("One number");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("One special character");
    }
    return errors;
  };

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
      setCurrentPage(1); // Reset to first page when loading new data
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || !creditsAmount) return;
    const amount = parseInt(creditsAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    setProcessing(true);
    try {
      await addCreditsToUser(selectedUser._id, amount);
      toast.success(`Added ${amount} credits to user`);
      setShowAddCreditsModal(false);
      setCreditsAmount("");
      setSelectedUser(null);
      await loadUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to add credits";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateCredits = async () => {
    if (!selectedUser || !creditsAmount) return;
    const amount = parseInt(creditsAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid non-negative number");
      return;
    }

    setProcessing(true);
    try {
      await updateUserCredits(selectedUser._id, amount);
      toast.success(`Updated user credits to ${amount}`);
      setShowEditCreditsModal(false);
      setCreditsAmount("");
      setSelectedUser(null);
      await loadUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update credits";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteUser(userId);
      toast.success("User deleted successfully");
      await loadUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
      toast.error(errorMessage);
    }
  };

  const handleViewUser = async (userId: string) => {
    try {
      const user = await getUserById(userId);
      if (user) {
        setSelectedUser(user);
        setLoadingPlans(true);
        setShowViewModal(true);
        
        // Load user plans
        try {
          const plans = await getUserPlans(user.clerkId);
          setUserPlans(plans);
        } catch (error) {
          console.error("Failed to load user plans:", error);
          setUserPlans([]);
        } finally {
          setLoadingPlans(false);
        }
      } else {
        toast.error("User not found");
      }
    } catch (error) {
      toast.error("Failed to load user details");
      console.error(error);
    }
  };

  const generatePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    
    // Ensure at least one of each type
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
    password += "0123456789"[Math.floor(Math.random() * 10)]; // number
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special char
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    password = password.split("").sort(() => Math.random() - 0.5).join("");
    
    setNewUserData({ ...newUserData, password });
    setPasswordCopied(false);
    setPasswordErrors([]); // Clear any validation errors since generated password meets all requirements
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(newUserData.password);
      setPasswordCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      toast.error("Failed to copy password");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.email.trim() || !newUserData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate password with detailed feedback
    const passwordValidationErrors = validatePassword(newUserData.password);
    if (passwordValidationErrors.length > 0) {
      toast.error(`Password requirements not met: ${passwordValidationErrors.join(", ")}`);
      setPasswordErrors(passwordValidationErrors);
      return;
    }

    const credits = parseInt(newUserData.initialCredits);
    if (isNaN(credits) || credits < 0) {
      toast.error("Please enter a valid non-negative number for credits");
      return;
    }

    setProcessing(true);
    setPasswordErrors([]);
    try {
      await createUser(newUserData.email.trim(), newUserData.password, credits);
      toast.success("User created successfully in Clerk and database");
      setShowCreateModal(false);
      setNewUserData({ email: "", password: "", initialCredits: "0" });
      setPasswordCopied(false);
      setPasswordErrors([]);
      await loadUsers();
    } catch (error: unknown) {
      // Extract error message - Clerk errors are wrapped in ValidationError
      let errorMessage = "Failed to create user";
      if (error instanceof Error) {
        errorMessage = error.message;
        // Set password errors if it's a password-related error
        if (error.message.toLowerCase().includes("password")) {
          const validationErrors = validatePassword(newUserData.password);
          setPasswordErrors(validationErrors);
        }
      } else if (typeof error === "object" && error !== null && "message" in error) {
        errorMessage = String(error.message);
      }
      toast.error(errorMessage, {
        duration: 6000, // Show longer for important errors
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.clerkId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#EE7B6C" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 bg-gray-50 z-10 pb-4 pt-2 -mt-2 -mx-6 px-4 sm:px-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black mb-2">User Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage users and their credits</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!adminEnabled}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          style={{ backgroundColor: "#EE7B6C" }}
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Create User</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      {!adminEnabled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> You are in demo mode. You can&apos;t change anything.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or Clerk ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Clerk ID</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Credits</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total Itineraries</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Created</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-black">{user.email || "N/A"}</div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 truncate max-w-[120px]">{user.clerkId}</div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">{user.credits.toLocaleString()}</div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-semibold">{user.planCount || 0}</div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1 lg:gap-2">
                      <button
                        onClick={() => handleViewUser(user._id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View User"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAddCreditsModal(true);
                        }}
                        disabled={!adminEnabled}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add Credits"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setCreditsAmount(user.credits.toString());
                          setShowEditCreditsModal(true);
                        }}
                        disabled={!adminEnabled}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit Credits"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        disabled={!adminEnabled}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {paginatedUsers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="space-y-4 p-4 max-h-[600px] overflow-y-auto">
              {paginatedUsers.map((user) => (
                <div key={user._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm font-medium text-black break-words">{user.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Clerk ID</p>
                      <p className="text-sm text-gray-600 break-all">{user.clerkId}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Credits</p>
                        <p className="text-sm font-semibold text-gray-900">{user.credits.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Itineraries</p>
                        <p className="text-sm font-semibold text-gray-900">{user.planCount || 0}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Created</p>
                      <p className="text-sm text-gray-600">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => handleViewUser(user._id)}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAddCreditsModal(true);
                        }}
                        disabled={!adminEnabled}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Add</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setCreditsAmount(user.credits.toString());
                          setShowEditCreditsModal(true);
                        }}
                        disabled={!adminEnabled}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        disabled={!adminEnabled}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {filteredUsers.length === 0 && (
          <div className="hidden md:block p-12 text-center">
            <p className="text-gray-500">No users found</p>
          </div>
        )}

        {/* Pagination */}
        {filteredUsers.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700 px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-4 sm:p-6 max-h-[90vh] flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">User Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="font-semibold text-black">{selectedUser.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Clerk ID</p>
                <p className="font-semibold text-black">{selectedUser.clerkId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Credits</p>
                <p className="font-semibold text-black">{selectedUser.credits.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Itineraries</p>
                <p className="font-semibold text-black">{selectedUser.planCount || 0}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Created At</p>
                <p className="font-semibold text-black break-words">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "N/A"}
                </p>
              </div>
            </div>

            {/* User Itineraries */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                User Itineraries ({userPlans.length})
              </h3>
              {loadingPlans ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#EE7B6C" }} />
                </div>
              ) : userPlans.length > 0 ? (
                <div className="space-y-3">
                  {userPlans.map((plan) => (
                    <div key={plan._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-black mb-1">{plan.destination}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(plan.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No itineraries found for this user</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedUser(null);
                  setUserPlans([]);
                }}
                className="w-full py-2 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  required
                  disabled={!adminEnabled || processing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      generatePassword();
                      setPasswordErrors([]);
                    }}
                    disabled={!adminEnabled || processing}
                    className="text-xs text-[#EE7B6C] hover:text-[#EE7B6C]/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Generate Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setNewUserData({ ...newUserData, password: newPassword });
                      setPasswordCopied(false);
                      // Real-time validation
                      if (newPassword.length > 0) {
                        setPasswordErrors(validatePassword(newPassword));
                      } else {
                        setPasswordErrors([]);
                      }
                    }}
                    required
                    disabled={!adminEnabled || processing}
                    minLength={8}
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100 ${
                      passwordErrors.length > 0 && newUserData.password.length > 0
                        ? "border-red-300 focus:ring-red-500"
                        : passwordErrors.length === 0 && newUserData.password.length >= 8
                        ? "border-green-300"
                        : "border-gray-300"
                    }`}
                    placeholder="Minimum 8 characters"
                  />
                  {newUserData.password && (
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                      title="Copy password"
                    >
                      {passwordCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
                {newUserData.password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Password Requirements:</p>
                    <div className="space-y-1">
                      {[
                        { check: newUserData.password.length >= 8, label: "At least 8 characters" },
                        { check: /[a-z]/.test(newUserData.password), label: "One lowercase letter" },
                        { check: /[A-Z]/.test(newUserData.password), label: "One uppercase letter" },
                        { check: /[0-9]/.test(newUserData.password), label: "One number" },
                        { check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newUserData.password), label: "One special character" },
                      ].map((req, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              req.check ? "bg-green-500" : "bg-gray-300"
                            }`}
                          >
                            {req.check && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className={req.check ? "text-green-700" : "text-gray-600"}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {newUserData.password.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long. Use a strong, unique password.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Credits</label>
                <input
                  type="number"
                  min="0"
                  value={newUserData.initialCredits}
                  onChange={(e) => setNewUserData({ ...newUserData, initialCredits: e.target.value })}
                  required
                  disabled={!adminEnabled || processing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter initial credits"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={processing || !adminEnabled}
                  className="flex-1 py-2 px-4 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#EE7B6C" }}
                >
                  {processing ? "Creating..." : "Create User"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewUserData({ email: "", password: "", initialCredits: "0" });
                    setPasswordCopied(false);
                    setPasswordErrors([]);
                  }}
                  className="flex-1 py-2 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Credits Modal */}
      {showAddCreditsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">Add Credits</h2>
            <p className="text-gray-600 mb-4">
              User: <span className="font-semibold">{selectedUser.email || selectedUser.clerkId}</span>
            </p>
            <p className="text-gray-600 mb-4">
              Current Credits: <span className="font-semibold">{selectedUser.credits.toLocaleString()}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Credits to Add</label>
              <input
                type="number"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent"
                placeholder="Enter amount"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddCredits}
                disabled={processing || !adminEnabled}
                className="flex-1 py-2 px-4 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#EE7B6C" }}
              >
                {processing ? "Adding..." : "Add Credits"}
              </button>
              <button
                onClick={() => {
                  setShowAddCreditsModal(false);
                  setSelectedUser(null);
                  setCreditsAmount("");
                }}
                className="flex-1 py-2 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Credits Modal */}
      {showEditCreditsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">Edit Credits</h2>
            <p className="text-gray-600 mb-4">
              User: <span className="font-semibold">{selectedUser.email || selectedUser.clerkId}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">New Credit Amount</label>
              <input
                type="number"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent"
                placeholder="Enter amount"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUpdateCredits}
                disabled={processing || !adminEnabled}
                className="flex-1 py-2 px-4 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#EE7B6C" }}
              >
                {processing ? "Updating..." : "Update Credits"}
              </button>
              <button
                onClick={() => {
                  setShowEditCreditsModal(false);
                  setSelectedUser(null);
                  setCreditsAmount("");
                }}
                className="flex-1 py-2 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

