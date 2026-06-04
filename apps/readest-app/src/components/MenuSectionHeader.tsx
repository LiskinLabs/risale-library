import React from 'react';

interface MenuSectionHeaderProps {
  label: string;
}

/**
 * Visual section header for long dropdown menus.
 * Groups related menu items under a labeled heading.
 */
const MenuSectionHeader: React.FC<MenuSectionHeaderProps> = ({ label }) => (
  <div
    role='presentation'
    className='px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider opacity-50'
  >
    {label}
  </div>
);

export default MenuSectionHeader;
