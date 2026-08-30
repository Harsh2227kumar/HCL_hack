'use client';
import { useState } from 'react';

interface ProgressToggleProps {
  resourceId: string;
  currentStatus: string;
  onStatusChange?: (status: string) => void;
}

export default function ProgressToggle({ resourceId, currentStatus, onStatusChange }: ProgressToggleProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setIsLoading(true);

    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId, status: newStatus }),
      });

      if (res.ok) {
        onStatusChange?.(newStatus);
      } else {
        // Revert on error
        setStatus(currentStatus);
      }
    } catch (error) {
      console.error('Failed to update progress', error);
      setStatus(currentStatus);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isLoading}
      className="border border-gray-300 rounded-md p-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
      <option value="NOT_STARTED">Not Started</option>
      <option value="IN_PROGRESS">In Progress</option>
      <option value="COMPLETED">Completed</option>
    </select>
  );
}
