"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  getAllDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  type DestinationData,
} from "@/server/admin/destinations";
import { Plus, Edit, Trash2, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const adminEnabled = process.env.NEXT_PUBLIC_ADMIN_ENABLED === "true";
const ITEMS_PER_PAGE = 10;

export default function AdminDestinationPage() {
  const [destinations, setDestinations] = useState<DestinationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDestination, setEditingDestination] = useState<DestinationData | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    image: "",
    description: "",
    region: "",
    isLive: true,
  });
  const [processing, setProcessing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const regions = [
    "South East Asia",
    "Europe",
    "Middle East",
    "Best Of Scandinavia",
    "Oceania",
  ];

  useEffect(() => {
    loadDestinations();
  }, []);

  const loadDestinations = async () => {
    try {
      const data = await getAllDestinations();
      setDestinations(data);
      setCurrentPage(1); // Reset to first page when loading new data
    } catch (error) {
      toast.error("Failed to load destinations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.image || !formData.description || !formData.region) {
      toast.error("Please fill in all fields");
      return;
    }

    setProcessing(true);
    try {
      if (editingDestination) {
        await updateDestination(editingDestination._id, formData);
        toast.success("Destination updated successfully");
      } else {
        await createDestination(formData.name, formData.image, formData.description, formData.region);
        toast.success("Destination created successfully");
      }
      setShowModal(false);
      resetForm();
      await loadDestinations();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save destination";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (destination: DestinationData) => {
    setEditingDestination(destination);
    setFormData({
      name: destination.name,
      image: destination.image,
      description: destination.description,
      region: destination.region,
      isLive: destination.isLive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this destination?")) {
      return;
    }

    try {
      await deleteDestination(id);
      toast.success("Destination deleted successfully");
      await loadDestinations();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete destination";
      toast.error(errorMessage);
    }
  };

  const handleToggleLive = async (destination: DestinationData) => {
    try {
      await updateDestination(destination._id, { isLive: !destination.isLive });
      toast.success(`Destination ${!destination.isLive ? "activated" : "deactivated"}`);
      await loadDestinations();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update destination";
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      image: "",
      description: "",
      region: "",
      isLive: true,
    });
    setEditingDestination(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);

      const response = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok && data.path) {
        setFormData({ ...formData, image: data.path });
        toast.success("Image uploaded successfully");
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
      console.error(error);
    } finally {
      setUploadingImage(false);
    }
  };

  const filteredDestinations = destinations.filter(
    (dest) =>
      dest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredDestinations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedDestinations = filteredDestinations.slice(startIndex, endIndex);

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
          <h1 className="text-2xl sm:text-3xl font-black text-black mb-2">Destinations Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage destinations displayed on the homepage</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          disabled={!adminEnabled}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          style={{ backgroundColor: "#EE7B6C" }}
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Add Destination</span>
          <span className="sm:hidden">Add</span>
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
              placeholder="Search destinations..."
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
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Region</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedDestinations.map((destination) => (
                <tr key={destination._id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-black">{destination.name}</div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">{destination.region}</div>
                  </td>
                  <td className="px-4 lg:px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">{destination.description}</div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleLive(destination)}
                      disabled={!adminEnabled}
                      className={`px-3 py-1 rounded-full text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                        destination.isLive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {destination.isLive ? "Live" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-1 lg:gap-2">
                      <button
                        onClick={() => handleEdit(destination)}
                        disabled={!adminEnabled}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(destination._id)}
                        disabled={!adminEnabled}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
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
        <div className="md:hidden space-y-4 p-4 max-h-[600px] overflow-y-auto">
          {paginatedDestinations.map((destination) => (
            <div key={destination._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="text-sm font-medium text-black">{destination.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Region</p>
                  <p className="text-sm text-gray-600">{destination.region}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-600">{destination.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleToggleLive(destination)}
                    disabled={!adminEnabled}
                    className={`px-3 py-1 rounded-full text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                      destination.isLive
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {destination.isLive ? "Live" : "Hidden"}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(destination)}
                      disabled={!adminEnabled}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(destination._id)}
                      disabled={!adminEnabled}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDestinations.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500">No destinations found</p>
          </div>
        )}

        {/* Pagination */}
        {filteredDestinations.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredDestinations.length)} of {filteredDestinations.length} destinations
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-4">
              {editingDestination ? "Edit Destination" : "Add Destination"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={!adminEnabled || processing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="e.g., Malaysia"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={!adminEnabled || processing || uploadingImage}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {uploadingImage && (
                    <p className="text-sm text-gray-600">Uploading image...</p>
                  )}
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    required
                    disabled={!adminEnabled || processing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                    placeholder="Image path (e.g., /malaysia.jpeg or /uploads/image.jpg)"
                  />
                  {formData.image && (
                    <div className="mt-2 relative w-24 h-24 sm:w-32 sm:h-32">
                      <Image
                        src={formData.image}
                        alt="Preview"
                        fill
                        className="object-cover rounded-lg border border-gray-200"
                        onError={() => {
                          // Image will fail gracefully if invalid
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={!adminEnabled || processing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="e.g., THE HIDDEN GEM OF ASIA"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Region</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  required
                  disabled={!adminEnabled || processing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">Select a region</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isLive"
                  checked={formData.isLive}
                  onChange={(e) => setFormData({ ...formData, isLive: e.target.checked })}
                  disabled={!adminEnabled || processing}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="isLive" className="text-sm font-semibold text-gray-700">
                  Live (visible on homepage)
                </label>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={processing || !adminEnabled}
                  className="flex-1 py-2 px-4 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#EE7B6C" }}
                >
                  {processing ? "Saving..." : editingDestination ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
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
    </div>
  );
}

