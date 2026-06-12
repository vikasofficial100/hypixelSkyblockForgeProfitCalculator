import React from 'react';

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-4 bg-sky-border rounded w-8"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-sky-border rounded w-32"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-sky-border rounded w-12"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-sky-border rounded w-16"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-sky-border rounded w-24"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-sky-border rounded w-24"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-sky-border rounded w-20"></div></td>
      <td className="px-4 py-3"><div className="h-4 bg-sky-border rounded w-16"></div></td>
    </tr>
  );
}

export default SkeletonRow;