import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { FaFilter, FaCheck } from 'react-icons/fa';
import { ProjectStatus } from '../../services/dataService';

interface StatusFilterProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

interface StatusOption {
  value: 'all' | ProjectStatus;
  label: string;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ selectedStatus, onStatusChange }) => {
  const statuses: StatusOption[] = [
    { value: 'all', label: 'All Status' },
    { value: 'not_started', label: 'Not Started' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
        <FaFilter className="mr-2 h-4 w-4 text-gray-500" />
        {statuses.find(s => s.value === selectedStatus)?.label || 'All Status'}
      </Menu.Button>

      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            {statuses.map((status) => (
              <Menu.Item key={status.value}>
                {({ active }) => (
                  <button
                    onClick={() => onStatusChange(status.value)}
                    className={`
                      ${active ? 'bg-gray-100' : ''}
                      ${selectedStatus === status.value ? 'bg-gray-50' : ''}
                      group flex items-center w-full px-4 py-2 text-sm text-gray-700
                    `}
                  >
                    <span className="flex-grow text-left">{status.label}</span>
                    {selectedStatus === status.value && (
                      <FaCheck className="ml-2 h-4 w-4 text-primary-600" />
                    )}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default StatusFilter; 