"use client";

import { useEffect, useState } from "react";
import { getAllFAQs, createFAQ, updateFAQ, deleteFAQ, type FAQData } from "@/server/admin/faqs";
import { Plus, Edit, Trash2, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const adminEnabled = process.env.NEXT_PUBLIC_ADMIN_ENABLED === "true";
const ITEMS_PER_PAGE = 10;

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQData | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    isLive: true,
    order: 0,
  });
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const data = await getAllFAQs();
      setFaqs(data);
      setCurrentPage(1); // Reset to first page when loading new data
    } catch (error) {
      toast.error("Failed to load FAQs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question || !formData.answer) {
      toast.error("Please fill in all fields");
      return;
    }

    setProcessing(true);
    try {
      if (editingFAQ) {
        await updateFAQ(editingFAQ._id, formData);
        toast.success("FAQ updated successfully");
      } else {
        await createFAQ(formData.question, formData.answer, formData.order);
        toast.success("FAQ created successfully");
      }
      setShowModal(false);
      resetForm();
      await loadFAQs();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save FAQ";
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = (faq: FAQData) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      isLive: faq.isLive,
      order: faq.order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) {
      return;
    }

    try {
      await deleteFAQ(id);
      toast.success("FAQ deleted successfully");
      await loadFAQs();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete FAQ";
      toast.error(errorMessage);
    }
  };

  const handleToggleLive = async (faq: FAQData) => {
    try {
      await updateFAQ(faq._id, { isLive: !faq.isLive });
      toast.success(`FAQ ${!faq.isLive ? "activated" : "deactivated"}`);
      await loadFAQs();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update FAQ";
      toast.error(errorMessage);
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      isLive: true,
      order: faqs.length,
    });
    setEditingFAQ(null);
  };

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredFAQs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedFAQs = filteredFAQs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#EE7B6C" }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-0 bg-gray-50 z-10 pb-4 pt-2 -mt-2 -mx-6 px-6">
        <div>
          <h1 className="text-3xl font-black text-black mb-2">FAQ Management</h1>
          <p className="text-gray-600">Manage frequently asked questions</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          disabled={!adminEnabled}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#EE7B6C" }}
        >
          <Plus className="w-5 h-5" />
          Add FAQ
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
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent"
            />
          </div>
        </div>

        <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-200">
          {paginatedFAQs.map((faq) => (
            <div key={faq._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-black">{faq.question}</h3>
                    <button
                      onClick={() => handleToggleLive(faq)}
                      disabled={!adminEnabled}
                      className={`px-3 py-1 rounded-full text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                        faq.isLive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {faq.isLive ? "Live" : "Hidden"}
                    </button>
                  </div>
                  <p className="text-gray-600 mb-2">{faq.answer}</p>
                  <p className="text-xs text-gray-500">Order: {faq.order}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(faq)}
                    disabled={!adminEnabled}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(faq._id)}
                    disabled={!adminEnabled}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-500">No FAQs found</p>
          </div>
        )}

        {/* Pagination */}
        {filteredFAQs.length > ITEMS_PER_PAGE && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredFAQs.length)} of {filteredFAQs.length} FAQs
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
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-black mb-4">
              {editingFAQ ? "Edit FAQ" : "Add FAQ"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Question</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  disabled={!adminEnabled || processing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter question"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Answer</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  required
                  disabled={!adminEnabled || processing}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="Enter answer"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  disabled={!adminEnabled || processing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EE7B6C] focus:border-transparent disabled:bg-gray-100"
                  placeholder="Display order"
                />
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
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={processing || !adminEnabled}
                  className="flex-1 py-2 px-4 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#EE7B6C" }}
                >
                  {processing ? "Saving..." : editingFAQ ? "Update" : "Create"}
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

