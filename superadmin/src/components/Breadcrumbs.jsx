import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { MdChevronRight } from 'react-icons/md';

const Breadcrumbs = ({ items }) => {
    const location = useLocation();

    // Default parsing from location if items not provided
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbItems = items || [
        { label: 'Home', to: '/' },
        ...pathnames.map((name, index) => {
            const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            return {
                label: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
                to: routeTo,
                isLast: index === pathnames.length - 1
            };
        })
    ];

    return (
        <nav className="flex items-center text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
                {breadcrumbItems.map((item, index) => (
                    <li key={index} className="flex items-center">
                        {index > 0 && <MdChevronRight className="w-4 h-4 mx-1 text-gray-400" />}
                        {item.to && !item.isLast ? (
                            <NavLink
                                to={item.to}
                                className="hover:text-blue-600 transition-colors"
                            >
                                {item.label}
                            </NavLink>
                        ) : (
                            <span className={`font-medium ${item.isLast ? 'text-gray-800' : ''}`}>
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
