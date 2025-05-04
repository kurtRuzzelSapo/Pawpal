import { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { FaUserCircle, FaCalendarAlt, FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import { AdoptionRequestDetails } from './AdoptionRequestDetails';
import { toast } from 'react-hot-toast';

interface AdoptionRequestsListProps {
  postId: number;
  ownerId: string;
}

export const AdoptionRequestsList: React.FC<AdoptionRequestsListProps> = ({ postId, ownerId }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Fetch adoption requests without using relationship shorthand
      const { data, error } = await supabase
        .from('adoption_requests')
        .select('*')
        .eq('post_id', postId)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // If we have requests, get basic requester info from auth schema
      if (data && data.length > 0) {
        const requests = [...data];
        
        // Get all unique requester IDs
        const requesterIds = [...new Set(requests.map(req => req.requester_id))];
        
        // Get auth user data for all requesters at once
        if (requesterIds.length > 0) {
          try {
            // Get user profiles from Supabase
            const { data: profiles, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', requesterIds);
            
            // If profiles table doesn't exist, try an alternative approach
            if (profilesError && profilesError.code === '42P01') {
              // Fetch user data one by one using the RPC function
              const userDataPromises = requesterIds.map(async (userId) => {
                const { data: userName, error: userError } = await supabase
                  .rpc('get_user_name', { user_id: userId });
                
                return {
                  id: userId,
                  full_name: !userError && userName ? userName : 'User',
                  avatar_url: null,
                };
              });
              
              const userProfiles = await Promise.all(userDataPromises);
              
              // Create a map of user profiles by ID
              const profileMap: Record<string, any> = {};
              userProfiles.forEach(profile => {
                profileMap[profile.id] = profile;
              });
              
              // Attach user info to requests
              requests.forEach(request => {
                if (request.requester_id && profileMap[request.requester_id]) {
                  request.requester = {
                    ...profileMap[request.requester_id],
                    email: 'Contact via app', // Privacy: don't expose email
                  };
                } else {
                  request.requester = {
                    full_name: 'Unknown User',
                    avatar_url: null,
                  };
                }
              });
            } else if (!profilesError && profiles) {
              // Create a map of user profiles by ID
              const profileMap: Record<string, any> = {};
              profiles.forEach(profile => {
                profileMap[profile.id] = profile;
              });
              
              // Attach user info to requests
              requests.forEach(request => {
                if (request.requester_id && profileMap[request.requester_id]) {
                  request.requester = {
                    ...profileMap[request.requester_id],
                    email: 'Contact via app', // Privacy: don't expose email
                  };
                } else {
                  request.requester = {
                    full_name: 'Unknown User',
                    avatar_url: null,
                  };
                }
              });
            } else {
              throw new Error('Failed to fetch user profiles');
            }
          } catch (profileError) {
            console.error('Error fetching user profiles:', profileError);
            // Fallback: just add placeholders
            requests.forEach(request => {
              request.requester = {
                full_name: 'Unknown User',
                avatar_url: null,
              };
            });
          }
        }
        
        setRequests(requests);
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      console.error('Error fetching adoption requests:', error);
      toast.error('Failed to load adoption requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    
    // Set up real-time subscription for adoption requests
    const subscription = supabase
      .channel('adoption_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'adoption_requests',
          filter: `post_id=eq.${postId}`
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [postId, ownerId]);

  const openRequestDetails = (requestId: number) => {
    // Validate that the request exists before opening the modal
    const request = requests.find(req => req.id === requestId);
    if (!request) {
      toast.error('This adoption request may have been deleted or is no longer available');
      return;
    }
    
    setSelectedRequestId(requestId);
    setShowModal(true);
  };

  // Add a function to handle quick actions
  const handleQuickAction = (requestId: number, action: 'view' | 'approve' | 'deny') => {
    const request = requests.find(req => req.id === requestId);
    if (!request) {
      toast.error('This adoption request may have been deleted or is no longer available');
      return;
    }
    
    openRequestDetails(requestId);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequestId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Approved</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="my-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-violet-500 border-r-4 border-violet-300 mx-auto"></div>
        <p className="mt-4 text-violet-600 font-['Poppins']">Loading adoption requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="my-6 bg-violet-50 rounded-xl p-6 text-center border border-violet-100">
        <p className="text-violet-600 font-['Poppins']">No adoption requests yet for this pet.</p>
      </div>
    );
  }

  return (
    <div className="my-6">
      <h3 className="text-xl font-semibold text-violet-800 mb-4 font-['Quicksand']">Adoption Requests</h3>
      
      <div className="space-y-4">
        {requests.map((request) => (
          <div 
            key={request.id} 
            className="bg-white rounded-xl border border-violet-100 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="bg-violet-100 rounded-full p-2 mr-3">
                  <FaUserCircle className="text-violet-600 text-xl" />
                </div>
                <div>
                  <p className="font-medium text-violet-800 font-['Poppins']">
                    {request.requester?.full_name || request.requester?.email || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center mt-1 font-['Poppins']">
                    <FaCalendarAlt className="mr-1" />
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(request.status)}
                <button
                  onClick={() => openRequestDetails(request.id)}
                  className="ml-2 p-2 text-violet-600 hover:bg-violet-50 rounded-full transition-colors"
                  title="View request details"
                >
                  <FaEye />
                </button>
              </div>
            </div>
            
            {/* Quick actions for pending requests */}
            {request.status === 'pending' && (
              <div className="mt-3 pt-3 border-t border-violet-50 flex justify-end gap-2">
                <button
                  onClick={() => handleQuickAction(request.id, 'view')}
                  className="px-3 py-1 bg-violet-100 text-violet-700 rounded-lg text-sm flex items-center gap-1 hover:bg-violet-200 transition-colors font-['Poppins']"
                >
                  <FaEye className="text-xs" />
                  View Details
                </button>
                <button
                  onClick={() => handleQuickAction(request.id, 'deny')}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm flex items-center gap-1 hover:bg-red-200 transition-colors font-['Poppins']"
                >
                  <FaTimes className="text-xs" />
                  Deny
                </button>
                <button
                  onClick={() => handleQuickAction(request.id, 'approve')}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm flex items-center gap-1 hover:bg-green-200 transition-colors font-['Poppins']"
                >
                  <FaCheck className="text-xs" />
                  Approve
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Request Details Modal */}
      {showModal && selectedRequestId && (
        <AdoptionRequestDetails 
          requestId={selectedRequestId} 
          onClose={closeModal}
          onStatusChange={fetchRequests}
        />
      )}
    </div>
  );
}; 