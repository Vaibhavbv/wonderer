"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreateTripButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        New Trip
      </Button>
      {/* Modal placeholder — would be a full create-trip modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-2">Create New Trip</h2>
            <p className="text-text-secondary mb-6">Start documenting your next adventure.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Trip Title</label>
                <input
                  type="text"
                  placeholder="e.g., Kyoto Cherry Blossom Season"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">Start Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">End Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" fullWidth onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button fullWidth onClick={() => setIsOpen(false)}>
                Create Trip
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
