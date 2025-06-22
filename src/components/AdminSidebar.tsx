import { NavLink } from "react-router-dom";
import { FaHome, FaUsers, FaUserMd, FaNewspaper } from "react-icons/fa";

interface AdminSidebarProps {
  userRole: string;
}

const AdminSidebar = ({ userRole }: AdminSidebarProps) => {
  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-md">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-violet-600">Pawpal</h1>
      </div>
      <nav className="mt-6">
        <NavLink
          to="/admin-dashboard"
          className={({ isActive }) =>
            `flex items-center px-6 py-3 text-gray-700 hover:bg-violet-50 hover:text-violet-600 ${
              isActive ? "bg-violet-50 text-violet-600" : ""
            }`
          }
        >
          <FaHome className="mr-3" />
          Dashboard
        </NavLink>
        {userRole === "admin" && (
          <>
            <NavLink
              to="/admin-dashboard/users"
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-gray-700 hover:bg-violet-50 hover:text-violet-600 ${
                  isActive ? "bg-violet-50 text-violet-600" : ""
                }`
              }
            >
              <FaUsers className="mr-3" />
              User Management
            </NavLink>
            <NavLink
              to="/admin-dashboard/vets"
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-gray-700 hover:bg-violet-50 hover:text-violet-600 ${
                  isActive ? "bg-violet-50 text-violet-600" : ""
                }`
              }
            >
              <FaUserMd className="mr-3" />
              Vet Management
            </NavLink>
          </>
        )}
        <NavLink
          to="/admin-dashboard/posts"
          className={({ isActive }) =>
            `flex items-center px-6 py-3 text-gray-700 hover:bg-violet-50 hover:text-violet-600 ${
              isActive ? "bg-violet-50 text-violet-600" : ""
            }`
          }
        >
          <FaNewspaper className="mr-3" />
          Post Management
        </NavLink>
      </nav>
    </div>
  );
};

export default AdminSidebar;
