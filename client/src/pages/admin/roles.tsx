import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { toast } from '@/hooks/use-toast';
import { capitalizeFirstLetter } from '@/lib/utils';
import React, { useState, useEffect, useMemo } from 'react';

// --- Interfaces and Data Template ---

export interface PermissionOption { key: string; label: string; }
export interface ModulePermission {
  id: string; // Plural (e.g., "courses") to match your backend
  module: string; // Singular (e.g., "Course") for display
  isModuleChecked: boolean;
  availablePermissions: PermissionOption[];
  permissions: Record<string, boolean>;
}

const crudPermissions: PermissionOption[] = [
  { key: 'view', label: 'View' }, { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' }, { key: 'delete', label: 'Delete' },
];

export const basePermissionsTemplate: ModulePermission[] = [
  { id: 'dashboard', module: 'Dashboard', isModuleChecked: false, availablePermissions: [ { key: 'viewStats', label: 'View Stats' }, { key: 'viewRevenue', label: 'View Revenue Data' }, { key: 'viewStudentDistribution', label: 'View Student Distribution' }, { key: 'viewRecentTransactions', label: 'View Recent Transactions' }, { key: 'viewTodayClasses', label: 'View Today\'s Classes' }, ], permissions: { viewStats: false, viewRevenue: false, viewStudentDistribution: false, viewRecentTransactions: false, viewTodayClasses: false }, },
  { id: 'courses', module: 'Course', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'batches', module: 'Batch', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'brands', module: 'Brand', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'branches', module: 'Branch', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'departments', module: 'Department', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'studio', module: 'Studio', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'inventory', module: 'Inventory', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'transportation', module: 'Transportation', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'attendance', module: 'Attendance', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'students', module: 'Student', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'employees', module: 'Employee', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'parents', module: 'Parent', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'invoices', module: 'Invoice', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'payments', module: 'Payment', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'receipts', module: 'Receipt', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
  { id: 'creditNotes', module: 'Credit Note', isModuleChecked: false, availablePermissions: crudPermissions, permissions: { view: false, create: false, edit: false, delete: false }, },
];

// --- Helper Function ---
function populatePermissionsFromAPI(
  baseTemplate: ModulePermission[],
  apiPermissions: Record<string, string[]> | null
): ModulePermission[] {
  const populatedState = JSON.parse(JSON.stringify(baseTemplate)) as ModulePermission[];
  if (!apiPermissions) return populatedState;

  for (const module of populatedState) {
    const allowedActions = new Set(apiPermissions[module.id] || []);
    if (allowedActions.size === 0) continue;
    let allInModuleChecked = true;
    for (const action of module.availablePermissions) {
      if (allowedActions.has(action.key)) {
        module.permissions[action.key] = true;
      } else {
        allInModuleChecked = false;
      }
    }
    module.isModuleChecked = allInModuleChecked;
  }
  return populatedState;
}

// --- React Component ---
export default function AdminRoles() {
  // CORRECTED: Hardcode the role to "branch_admin" because that's all this page does.
  const roleName = 'branch_admin';

  const [description, setDescription] = useState<string>('');
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isAllSelected, setIsAllSelected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState(false);

  // This useEffect fetches the data for the 'branch_admin' role when the page loads.
  useEffect(() => {
    const loadRoleData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/roles/${roleName}`);
        if (!response.ok) {
          throw new Error(`Role '${roleName}' not found or API error.`);
        }
        const roleData = await response.json();

        setDescription(roleData.description || 'Administrator with branch-level access');
        const populatedState = populatePermissionsFromAPI(basePermissionsTemplate, roleData.permissions);
        setPermissions(populatedState);
      } catch (error) {
        alert(`Failed to load role data: ${error}`);
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoleData();
  }, [roleName]); // It runs once, when roleName is set.

  useEffect(() => {
    if (!isLoading) setIsAllSelected(permissions.every(mod => mod.isModuleChecked));
  }, [permissions, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted"); // ✅ Log it for debugging

    if (!isEditing) {
      console.log("Not editing, skip submit");
      return;
    }

    // Convert the UI state into the exact JSON format your backend needs.
    const permissionsToSave: Record<string, string[]> = {};
    for (const module of permissions) {
      const enabledActions = Object.keys(module.permissions).filter(key => module.permissions[key]);
      if (enabledActions.length > 0) {
        permissionsToSave[module.id] = enabledActions;
      }
    }
    
    const payload = { permissions: permissionsToSave, description };
    
    try {
      // This is the REAL API call that saves your changes.
      const response = await fetch(`/api/roles/${roleName}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "An API error occurred.");
      }

      toast({
        title: "Success",
        description: `Role '${roleName}' was updated successfully!`,
      });

      setIsEditing(false);

    } catch (err) {
      toast({
        title: "Error",
        description: `Error saving role: ${err}`,
        variant: "destructive",
      });
      console.error(err);
    }
  };
  
  // Handlers for checkbox logic (no changes needed)
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setPermissions(prev => prev.map(mod => ({ ...mod, isModuleChecked: checked, permissions: Object.keys(mod.permissions).reduce((acc, key) => ({ ...acc, [key]: checked }), {}) })));
  };
  const handleModuleCheckboxChange = (moduleId: string, checked: boolean) => {
    setPermissions(prev => prev.map(mod => {
        if (mod.id === moduleId) { return { ...mod, isModuleChecked: checked, permissions: Object.keys(mod.permissions).reduce((acc, key) => ({ ...acc, [key]: checked }), {}) }; }
        return mod;
    }));
  };
  const handlePermissionChange = (moduleId: string, permissionKey: string, checked: boolean) => {
    setPermissions(prev => prev.map(mod => {
        if (mod.id === moduleId) {
            const newPermissions = { ...mod.permissions, [permissionKey]: checked };
            const allInModuleChecked = mod.availablePermissions.every(p => newPermissions[p.key]);
            return { ...mod, permissions: newPermissions, isModuleChecked: allInModuleChecked };
        }
        return mod;
    }));
  };
  
  const maxPermissions = useMemo(() => Math.max(0, ...basePermissionsTemplate.map(mod => mod.availablePermissions.length)), []);
  const permissionsTableGridStyle = { gridTemplateColumns: `150px 200px repeat(${maxPermissions}, 1fr)` };
  
  if (isLoading) return <AppShell><div>Loading permissions for {roleName}...</div></AppShell>;

  return (
    <AppShell>
      {/* <PageHeader
        title={`Roles & Permissions: ${capitalizeFirstLetter(roleName)}`}
        description="Manage roles and permissions for your application."
        actions={ <Button type="submit" form="role-form-id">Save Changes</Button> }
      /> */}
      <PageHeader
        title={`Roles & Permissions: ${capitalizeFirstLetter(roleName)}`}
        description="Manage roles and permissions"
        actions={
          !isEditing ? (
            <button type="button" onClick={() => setIsEditing(true)} className="bg-primary text-white px-4 py-2 rounded font-medium">
              Edit Role
            </button>
          ) : (
            <Button type="submit" form="role-form-id">Save Changes</Button>
          )
        }
      />
      <style>{componentStyles}</style>
      <div className="role-container">
        <form id="role-form-id" className="role-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="roleName">Role Name</label>
              <input type="text" id="roleName" value={roleName} readOnly />
            </div>
            <div className="form-group">
              <label htmlFor="roleDescription">Description</label>
              <input type="text" id="roleDescription" value={description} onChange={e => setDescription(e.target.value)} readOnly={!isEditing}/>
            </div>
          </div>
          <div className="permissions-section">
            <div className="permissions-header">
              <h2>✓ Permissions</h2>
              <label className="checkbox-label"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} />Select / Deselect All</label>
            </div>
            <div className="permissions-table">
              <div className="permissions-table-header" style={permissionsTableGridStyle}>
                <div className="header-cell">Check/Uncheck</div>
                <div className="header-cell module-header">Module</div>
                {Array.from({ length: maxPermissions }).map((_, i) => (<div key={`h-${i}`} className="header-cell">Permission</div>))}
              </div>
              {permissions.map(mod => (
                <div key={mod.id} className="permission-row" style={permissionsTableGridStyle}>
                  <div className="permission-cell"><input type="checkbox" checked={mod.isModuleChecked} onChange={e => handleModuleCheckboxChange(mod.id, e.target.checked)} /></div>
                  <div className="permission-cell module-name">{mod.module}</div>
                  {Array.from({ length: maxPermissions }).map((_, index) => {
                    const p = mod.availablePermissions[index];
                    return (
                      <div key={p ? p.key : `p-${index}`} className="permission-cell">
                        {p && (
                          <div className="checkbox-label">
                            <input type="checkbox" id={`${mod.id}-${p.key}`} checked={mod.permissions[p.key] || false} disabled={!isEditing} onChange={e => handlePermissionChange(mod.id, p.key, e.target.checked)} />
                            <label htmlFor={`${mod.id}-${p.key}`}>{p.label}</label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

const componentStyles = `
  /* Same styles as before */
  .role-container { font-family: sans-serif; background-color: #f7f7f9; padding: 24px; color: #333; }
  .role-form { background-color: #fff; border-radius: 8px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .form-row { display: flex; gap: 24px; margin-bottom: 24px; }
  .form-group { flex: 1; }
  .form-group label { display: block; margin-bottom: 8px; font-weight: 500; font-size: 14px; color: #555; }
  .form-group input[type="text"] { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
  .form-group input[readOnly] { background-color: #f0f0f0; cursor: not-allowed; }
  .permissions-section { border: 1px solid #e0e0e0; border-radius: 8px; overflow-x: auto; }
  .permissions-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background-color: #f7f7f9; border-bottom: 1px solid #e0e0e0; }
  .permissions-header h2 { font-size: 16px; font-weight: 600; margin: 0; color: #6c63ff; }
  .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 14px; }
  .permissions-table { display: flex; flex-direction: column; min-width: 1200px; }
  .permissions-table-header, .permission-row { display: grid; align-items: center; padding: 0 16px; min-height: 50px; border-bottom: 1px solid #f0f0f0; gap: 16px; }
  .permission-row:last-child { border-bottom: none; }
  .permission-row:nth-child(even) { background-color: #fcfcfd; }
  .permissions-table-header { font-weight: 600; color: #888; font-size: 12px; text-transform: uppercase; }
  .header-cell, .permission-cell { padding: 8px 0; text-align: left; white-space: nowrap; }
  .module-name { font-weight: 500; }
  input[type="checkbox"] { width: 16px; height: 16px; accent-color: #6c63ff; cursor: pointer; }
`;