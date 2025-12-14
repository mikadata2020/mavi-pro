import React, { useState, useEffect } from 'react';
import { getSupabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const MENU_ITEMS = [
    { path: '/', title: 'Video Workspace' },
    { path: '/analysis', title: 'Analysis Dashboard' },
    { path: '/rearrangement', title: 'Element Rearrangement' },
    { path: '/cycle-analysis', title: 'Cycle Time Analysis' },
    { path: '/aggregation', title: 'Cycle Aggregation' },
    { path: '/standard-time', title: 'Standard Time' },
    { path: '/waste-elimination', title: 'Waste Elimination' },
    { path: '/therblig', title: 'Therblig Analysis' },
    { path: '/statistical-analysis', title: 'Statistical Analysis' },
    { path: '/mtm', title: 'MTM Calculator' },
    { path: '/allowance', title: 'Allowance Calculator' },
    { path: '/best-worst', title: 'Best/Worst Cycle' },
    { path: '/yamazumi', title: 'Yamazumi Chart' },
    { path: '/multi-axial', title: 'Multi-Axial Analysis' },
    { path: '/manual-creation', title: 'Manual Creation' },
    { path: '/spaghetti-chart', title: 'Spaghetti Chart' },
    { path: '/ml-data', title: 'Machine Learning Data' },
    { path: '/object-tracking', title: 'Object Tracking' },
    { path: '/predictive-maintenance', title: 'Predictive Maintenance' },
    { path: '/comparison', title: 'Video Comparison' },
    { path: '/multi-camera', title: 'Multi-Camera Fusion' },
    { path: '/vr-training', title: 'VR Training' },
    { path: '/knowledge-base', title: 'Knowledge Base' },
    { path: '/broadcast', title: 'Broadcast' },
    { path: '/action-recognition', title: 'Action Recognition' },
    { path: '/files', title: 'File Explorer' },
    { path: '/help', title: 'Help' },
];

function AdminPanel() {
    const { userRole } = useAuth();
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userRole === 'admin') {
            loadUsers();
        }
    }, [userRole]);

    const loadUsers = async () => {
        try {
            const supabase = getSupabase();

            // Get all users with their roles
            const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

            if (usersError) throw usersError;

            // Get roles for each user
            const { data: rolesData, error: rolesError } = await supabase
                .from('user_roles')
                .select('*');

            if (rolesError) console.warn('Error loading roles:', rolesError);

            const usersWithRoles = usersData.users.map(user => {
                const roleInfo = rolesData?.find(r => r.user_id === user.id);
                return {
                    ...user,
                    role: roleInfo?.role || 'user'
                };
            });

            setUsers(usersWithRoles);
            setLoading(false);
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Failed to load users. Make sure you have admin privileges.');
            setLoading(false);
        }
    };

    const loadUserPermissions = async (userId) => {
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('user_permissions')
                .select('menu_path, allowed')
                .eq('user_id', userId);

            if (error) throw error;

            const permissionsMap = {};
            data.forEach(p => {
                permissionsMap[p.menu_path] = p.allowed;
            });
            setUserPermissions(permissionsMap);
        } catch (error) {
            console.error('Error loading permissions:', error);
            setUserPermissions({});
        }
    };

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        loadUserPermissions(user.id);
    };

    const handleTogglePermission = async (menuPath) => {
        if (!selectedUser) return;

        const currentValue = userPermissions[menuPath];
        const newValue = currentValue === undefined ? false : !currentValue;

        try {
            const supabase = getSupabase();

            if (currentValue === undefined) {
                // Insert new permission
                const { error } = await supabase
                    .from('user_permissions')
                    .insert({ user_id: selectedUser.id, menu_path: menuPath, allowed: newValue });

                if (error) throw error;
            } else {
                // Update existing permission
                const { error } = await supabase
                    .from('user_permissions')
                    .update({ allowed: newValue })
                    .eq('user_id', selectedUser.id)
                    .eq('menu_path', menuPath);

                if (error) throw error;
            }

            setUserPermissions(prev => ({ ...prev, [menuPath]: newValue }));
        } catch (error) {
            console.error('Error updating permission:', error);
            alert('Failed to update permission: ' + error.message);
        }
    };

    const handleToggleRole = async (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';

        if (!confirm(`Change ${user.email} role to ${newRole.toUpperCase()}?`)) return;

        try {
            const supabase = getSupabase();
            const { error } = await supabase
                .from('user_roles')
                .upsert({ user_id: user.id, role: newRole });

            if (error) throw error;

            loadUsers();
            alert(`Role updated to ${newRole}`);
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role: ' + error.message);
        }
    };

    if (userRole !== 'admin') {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1>Access Denied</h1>
                <p>You need admin privileges to access this page.</p>
            </div>
        );
    }

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div style={{ padding: '20px', height: '100vh', display: 'flex', gap: '20px' }}>
            {/* User List */}
            <div style={{ flex: 1, backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '20px', overflowY: 'auto' }}>
                <h2 style={{ margin: '0 0 20px 0', color: 'white' }}>👥 Users</h2>
                {users.map(user => (
                    <div
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        style={{
                            padding: '15px',
                            marginBottom: '10px',
                            backgroundColor: selectedUser?.id === user.id ? '#0078d4' : '#2a2a2a',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', color: 'white' }}>{user.email}</div>
                                <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                                    {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleRole(user);
                                }}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: user.role === 'admin' ? '#f44336' : '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {user.role === 'admin' ? 'Demote' : 'Promote'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Permission Editor */}
            <div style={{ flex: 2, backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '20px', overflowY: 'auto' }}>
                {selectedUser ? (
                    <>
                        <h2 style={{ margin: '0 0 10px 0', color: 'white' }}>
                            🔐 Permissions for {selectedUser.email}
                        </h2>
                        <p style={{ color: '#aaa', marginBottom: '20px' }}>
                            {selectedUser.role === 'admin' ?
                                '⚠️ Admin has access to all menus by default' :
                                'Toggle menu access for this user'}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px' }}>
                            {MENU_ITEMS.map(item => {
                                const isAllowed = userPermissions[item.path] !== false;
                                return (
                                    <div
                                        key={item.path}
                                        onClick={() => selectedUser.role !== 'admin' && handleTogglePermission(item.path)}
                                        style={{
                                            padding: '15px',
                                            backgroundColor: isAllowed ? '#2a5a2a' : '#5a2a2a',
                                            borderRadius: '8px',
                                            cursor: selectedUser.role === 'admin' ? 'not-allowed' : 'pointer',
                                            opacity: selectedUser.role === 'admin' ? 0.5 : 1,
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span style={{ color: 'white' }}>{item.title}</span>
                                        <span style={{ fontSize: '1.5rem' }}>
                                            {isAllowed ? '✅' : '❌'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        <p>Select a user to manage permissions</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminPanel;
