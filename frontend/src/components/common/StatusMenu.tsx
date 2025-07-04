import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ProjectStatus } from '../../services/dataService';

interface StatusMenuProps {
  currentStatus: ProjectStatus;
  onStatusChange: (status: ProjectStatus) => void;
  size?: 'sm' | 'md' | 'lg';
}

const StatusMenu: React.FC<StatusMenuProps> = ({ currentStatus, onStatusChange, size = 'md' }) => {
  const statuses: { value: ProjectStatus; label: string; color: string }[] = [
    { value: 'not_started', label: 'Not Started', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Pending', color: 'bg-orange-100 text-orange-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  const currentStatusOption = statuses.find(s => s.value === currentStatus) || statuses[0];

  const getStatusClasses = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const buttonSizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        className={`inline-flex items-center justify-center rounded-full font-medium ${buttonSizeClasses[size]} ${getStatusClasses(currentStatus)}`}
      >
        {currentStatusOption.label}
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
        <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="p-1">
            {statuses.map((status) => (
              <Menu.Item key={status.value}>
                {({ active }) => (
                  <button
                    onClick={() => onStatusChange(status.value)}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    <span className={`mr-2 inline-block h-2 w-2 rounded-full ${status.color.replace('text-', 'bg-')}`} />
                    {status.label}
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

export default StatusMenu; 