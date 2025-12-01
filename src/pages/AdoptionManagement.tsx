import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase-client";
import { toast } from "react-hot-toast";
import { FaFilter, FaTimes } from "react-icons/fa";
// REMOVED: import { useMediaQuery } from "react-responsive";

interface AdoptedRecord {
  post_id: number;
  post_name: string;
  image_url?: string | null;
  adopted_at?: string | null;
  adopter_id?: string | null;
  adopter_name?: string | null;
  adopter_email?: string | null;
}

export default function AdoptionManagement() {
  const [loading, setLoading] = useState(true);

  const fetchAdoptions = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch posts marked as adopted. Try filtering directly in query first
      let postsData: any[] | null = null;
      let postsError: any = null;
      
      // First, try to query posts with status filter directly (case-insensitive)
      try {
        const res = await supabase
          .from("posts")
          .select("id, name, image_url, updated_at, created_at, status")
          .in("status", ["adopted", "Adopted", "ADOPTED"])
          .order("updated_at", { ascending: false });
        postsData = res.data as any[] | null;
        postsError = res.error;
        
        if (postsError || !postsData || postsData.length === 0) {
          console.warn("No posts found with direct status filter, trying without filter:", postsError);
          // If direct filter returns no results, try without filter and filter in JS
          const res2 = await supabase
            .from("posts")
            .select("id, name, image_url, updated_at, created_at, status")
            .order("updated_at", { ascending: false });
          postsData = res2.data as any[] | null;
          postsError = res2.error;
        }
      } catch (e) {
        postsError = e;
        console.warn("Exception with posts table, trying post table:", e);
      }

      // If still no data, try singular table name 'post' as fallback
      if ((postsError || !postsData || postsData.length === 0)) {
        try {
          const res = await supabase
            .from("post")
            .select("id, name, image_url, updated_at, created_at, status")
            .in("status", ["adopted", "Adopted", "ADOPTED"])
            .order("updated_at", { ascending: false });
          postsData = res.data as any[] | null;
          postsError = res.error;
          
          if (postsError || !postsData || postsData.length === 0) {
            // Try without filter
            const res2 = await supabase
              .from("post")
              .select("id, name, image_url, updated_at, created_at, status")
              .order("updated_at", { ascending: false });
            postsData = res2.data as any[] | null;
            postsError = res2.error;
          }
        } catch (e) {
          postsError = e;
        }
      }

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        throw postsError;
      }

      // Filter for adopted posts - handle various case variations (fallback if query filter didn't work)
      const adoptedPosts =
        postsData?.filter((p: any) => {
          const status = (p.status || "").toLowerCase().trim();
          return status === "adopted" || status.includes("adopted");
        }) || [];

      console.log(`Total posts fetched: ${postsData?.length || 0}`);
      console.log(`Posts with 'adopted' status: ${adoptedPosts.length}`);
      
      if (adoptedPosts.length === 0) {
        console.warn("No adopted posts found. Checking all posts statuses:", postsData?.map((p: any) => ({ id: p.id, name: p.name, status: p.status })));
        setLoading(false);
        return;
      }

      const postIds = adoptedPosts.map((p: any) => p.id);
      
      console.log(`Found ${adoptedPosts.length} adopted posts with IDs:`, postIds);

      if (postIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch adoption requests for these posts
      // Priority: Get approved requests first, then fallback to all requests for adopted posts
      let appsData: any[] | null = null;
      let appsError: any = null;
      
      // First, try to get all adoption_requests for these posts (not filtered by status)
      // This ensures we get the data even if status filtering fails
      try {
        const res = await supabase
          .from("adoption_requests")
          .select("post_id, requester_id as applicant_id, created_at, updated_at, status")
          .in("post_id", postIds as any)
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false });
        appsData = res.data as any[] | null;
        appsError = res.error;
        
        if (appsError) {
          console.warn("Error fetching adoption_requests:", appsError);
        }
      } catch (e) {
        appsError = e;
        console.warn("Exception fetching adoption_requests:", e);
      }

      // If still no data, try adoption_applications as fallback
      if ((appsError || !appsData || appsData.length === 0)) {
        try {
          const res = await supabase
            .from("adoption_applications")
            .select("post_id, applicant_id, created_at, updated_at, status")
            .in("post_id", postIds as any)
            .order("updated_at", { ascending: false })
            .order("created_at", { ascending: false });
          appsData = res.data as any[] | null;
          appsError = res.error;
          
          if (appsError) {
            console.warn("Error fetching adoption_applications:", appsError);
          }
        } catch (e) {
          appsError = e;
          console.warn("Exception fetching adoption_applications:", e);
        }
      }

      // Log for debugging
      if (appsData && appsData.length > 0) {
        console.log("Found adoption requests/applications:", appsData.length);
      } else {
        console.warn("No adoption requests/applications found for adopted posts:", postIds);
      }

      // Don't throw error if no apps found - we'll handle it gracefully
      if (appsError && appsError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error("Error fetching adoption data:", appsError);
      }

      const ACCEPTED_STATUSES = ["approved", "accepted", "adopted", "completed"];

      // Build mapping postId -> approved application
      // Priority: approved requests first, then most recent if multiple approved
      const appMap = new Map<number, any>();
      
      if (!appsData || appsData.length === 0) {
        console.warn("No adoption requests/applications data available");
      } else {
        // First, collect all approved requests
        const approvedApps = (appsData || []).filter((app: any) => {
          const normalizedStatus = (app.status || "").toLowerCase();
          return ACCEPTED_STATUSES.includes(normalizedStatus);
        });

        console.log(`Found ${approvedApps.length} approved requests out of ${appsData.length} total`);

        // For each approved app, keep the most recent one per post
        approvedApps.forEach((app: any) => {
          const existing = appMap.get(app.post_id);
          if (!existing) {
            appMap.set(app.post_id, app);
          } else {
            // If there's already an approved request, keep the most recent one
            const existingDate = new Date(existing.created_at || existing.updated_at || 0);
            const appDate = new Date(app.created_at || app.updated_at || 0);
            if (appDate > existingDate) {
              appMap.set(app.post_id, app);
            }
          }
        });

        // If no approved requests found, fallback to most recent request per post
        // This handles cases where status might not be set correctly
        if (appMap.size === 0) {
          console.warn("No approved requests found, using most recent request per post");
          (appsData || []).forEach((app: any) => {
            const existing = appMap.get(app.post_id);
            if (!existing) {
              appMap.set(app.post_id, app);
            } else {
              const existingDate = new Date(existing.created_at || existing.updated_at || 0);
              const appDate = new Date(app.created_at || app.updated_at || 0);
              if (appDate > existingDate) {
                appMap.set(app.post_id, app);
              }
            }
          });
        }
      }
      
      console.log(`Mapped ${appMap.size} adoption requests to posts`);

      const adopterIds = Array.from(new Set(Array.from(appMap.values()).map((a: any) => a.applicant_id).filter(Boolean)));

      // Build a users map keyed by adopter id -> full name.
      // Preferred source: `profiles` table (has `id, full_name`).
      // Fallback: call RPC `get_user_name(user_id)` if profiles are not available.
      let usersMap: Record<string, any> = {};
      if (adopterIds.length > 0) {
        try {
          // Try profiles first (profiles.id references auth.users.id)
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", adopterIds as any);

          if (profilesError) throw profilesError;

          if (profilesData && profilesData.length > 0) {
            usersMap = profilesData.reduce((acc: Record<string, any>, u: any) => {
              acc[u.id] = { id: u.id, full_name: u.full_name, email: null };
              return acc;
            }, {} as Record<string, any>);
          }

          // Fetch additional info from users table (for email / fallback names)
          const { data: userTableData } = await supabase
            .from("users")
            .select("user_id, full_name, email")
            .in("user_id", adopterIds as any);

          (userTableData || []).forEach((u) => {
            usersMap[u.user_id] = {
              id: u.user_id,
              full_name: u.full_name || usersMap[u.user_id]?.full_name || "Unknown",
              email: u.email || usersMap[u.user_id]?.email || null,
            };
          });

          // Fallback: call RPC `get_user_name` for ids still missing
          const missingIds = adopterIds.filter((uid) => !usersMap[uid]);
          await Promise.all(
            missingIds.map(async (uid: string) => {
              try {
                const { data: nameData, error: nameError } = await supabase.rpc("get_user_name", { user_id: uid });
                if (!nameError && nameData) {
                  usersMap[uid] = {
                    id: uid,
                    full_name: Array.isArray(nameData) ? nameData[0] : nameData,
                    email: null,
                  };
                }
              } catch (err) {
                console.warn("RPC get_user_name failed for", uid, err);
              }
            })
          );
        } catch (e) {
          // If we fail to fetch user info due to RLS, log and continue
          console.warn("Failed to fetch adopter user records:", e);
        }
      }

      // Always create records for all adopted posts, even if we can't find adoption request info
      const records: AdoptedRecord[] = adoptedPosts.map((p: any) => {
        const app = appMap.get(p.id);
        const adopterId = app?.applicant_id || null;
        const adopter = adopterId ? usersMap[adopterId] : null;
        
        // Log if we can't find adoption request for a post
        if (!app) {
          console.warn(`No adoption request found for post ${p.id} (${p.name})`);
        } else if (!adopterId) {
          console.warn(`No adopter ID found for post ${p.id} adoption request`);
        } else if (!adopter) {
          console.warn(`No adopter user info found for adopter ID ${adopterId} (post ${p.id})`);
        }
        
        // Use updated_at from the approved request as the adoption date, fallback to post updated_at
        const adoptionDate = app?.updated_at || app?.created_at || p.updated_at || p.created_at || null;
        
        return {
          post_id: p.id,
          post_name: p.name,
          image_url: p.image_url || null,
          adopted_at: adoptionDate,
          adopter_id: adopterId,
          adopter_name: adopter?.full_name || (adopterId ? "Unknown User" : "Adopter information not available"),
          adopter_email: adopter?.email || null,
        };
      });

      console.log(`Created ${records.length} adoption records`);
      console.log("Records:", records);
      // setRecords(records); // This line is removed as per the edit hint
    } catch (error) {
      console.error("Error fetching adoptions:", error);
      toast.error("Failed to fetch adoption records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdoptions();
  }, [fetchAdoptions]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  // --- FAKE DATA START ---
  const fakeRecords = [
    {
      post_id: 1,
      post_name: 'Nadia',
      breed: 'Persian (Cat)',
      adopted_at: '2025-12-01T00:00:00.000Z',
      adopter_name: 'Knowell Lucky Versoza',
    },
  ];
  // --- FAKE DATA END ---

  // Filters state
  const [filters, setFilters] = useState({
    adopter: "",
    postName: "",
    breed: "",
    adoptedAfter: "",
    adoptedBefore: ""
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  // REMOVED: const isMobile = window.innerWidth < 1024;

  // Filtering logic
  const filteredRecords = fakeRecords.filter((rec) => {
    let match = true;
    if (filters.adopter && !(rec.adopter_name?.toLowerCase().includes(filters.adopter.toLowerCase()))) match = false;
    if (filters.postName && !(rec.post_name?.toLowerCase().includes(filters.postName.toLowerCase()))) match = false;
    if (filters.breed && !(rec.breed?.toLowerCase().includes(filters.breed.toLowerCase()))) match = false;
    if (filters.adoptedAfter && new Date(rec.adopted_at || 0) < new Date(filters.adoptedAfter)) match = false;
    if (filters.adoptedBefore && new Date(rec.adopted_at || 0) > new Date(filters.adoptedBefore)) match = false;
    return match;
  });

  // Filter UI component
  function FilterControls({ onClose }: { onClose?: () => void }) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-violet-700 mb-1">Adopter Name</label>
          <input type="text" value={filters.adopter} onChange={e => setFilters(f => ({...f, adopter: e.target.value}))} className="w-full px-4 py-2 border rounded focus:ring-violet-400" placeholder="e.g., John" />
        </div>
        <div>
          <label className="block text-sm font-medium text-violet-700 mb-1">Pet Name</label>
          <input type="text" value={filters.postName} onChange={e => setFilters(f => ({...f, postName: e.target.value}))} className="w-full px-4 py-2 border rounded focus:ring-violet-400" placeholder="e.g., Luna" />
        </div>
        <div>
          <label className="block text-sm font-medium text-violet-700 mb-1">Breed</label>
          <input type="text" value={filters.breed} onChange={e => setFilters(f => ({...f, breed: e.target.value}))} className="w-full px-4 py-2 border rounded focus:ring-violet-400" placeholder="e.g., Persian" />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-violet-700 mb-1">Adopted After</label>
            <input type="date" value={filters.adoptedAfter} onChange={e => setFilters(f => ({...f, adoptedAfter: e.target.value}))} className="w-full px-4 py-2 border rounded focus:ring-violet-400"/>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-violet-700 mb-1">Adopted Before</label>
            <input type="date" value={filters.adoptedBefore} onChange={e => setFilters(f => ({...f, adoptedBefore: e.target.value}))} className="w-full px-4 py-2 border rounded focus:ring-violet-400"/>
          </div>
        </div>
        {onClose && <button className="w-full bg-violet-600 text-white px-4 py-3 rounded mt-4 font-semibold hover:bg-violet-700 transition" onClick={onClose} type="button">Apply</button>}
      </div>
    );
  }

  return (
    <div className="p-6 relative">
      {/* Mobile Filter Button */}
      <button
        className="lg:hidden fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-full shadow-lg hover:scale-110 active:scale-100 transition-transform"
        onClick={() => setDrawerOpen(true)}
        aria-label="Open filters"
      >
        <FaFilter className="w-5 h-5" />
      </button>
      {/* Mobile Drawer + Overlay */}
      {drawerOpen && (
        <div>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className={`fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-white rounded-l-2xl shadow-2xl z-50 p-8 pt-10 transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ boxShadow: '0 6px 32px 0 rgba(80,64,187,0.18)' }}
            role="dialog" aria-modal="true"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-2xl font-bold text-violet-800">Filters</span>
              <button className="p-2 -mr-2 text-slate-600 hover:text-slate-800" aria-label="Close filters" onClick={() => setDrawerOpen(false)}>
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <FilterControls onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop Filter Bar */}
      <div className="hidden lg:block mb-4 sticky top-0 z-20 bg-white p-4 rounded-2xl shadow-md border border-gray-50">
        <FilterControls />
      </div>
      {/* Table as before, but with filteredRecords */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adopter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adopted On</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Breed</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.map((r) => (
              <tr key={r.post_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{r.post_name} <span className="text-xs text-gray-500 font-normal">({r.breed})</span></div>
                  <div className="text-sm text-gray-500">ID: {r.post_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{r.adopter_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(r.adopted_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {r.breed}
                </td>
              </tr>
            ))}
            {filteredRecords.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400">No adoption records found matching your filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
