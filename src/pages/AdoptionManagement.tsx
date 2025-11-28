import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase-client";
import { toast } from "react-hot-toast";

interface AdoptedRecord {
  post_id: number;
  post_name: string;
  image_url?: string | null;
  adopted_at?: string | null;
  adopter_id?: string | null;
  adopter_name?: string | null;
}

export default function AdoptionManagement() {
  const [records, setRecords] = useState<AdoptedRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdoptions = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch posts marked as adopted. Some schemas use 'posts' while others use 'post'.
      let postsData: any[] | null = null;
      let postsError: any = null;
      try {
        const res = await supabase
          .from("posts")
          .select("id, name, image_url, updated_at, created_at, status")
          .ilike("status", "%adopted%")
          .order("updated_at", { ascending: false });
        postsData = res.data as any[] | null;
        postsError = res.error;
      } catch (e) {
        postsError = e;
      }

      if ((postsError || !postsData) && (!postsData || postsData.length === 0)) {
        // Try singular table name 'post' as fallback
        try {
          const res = await supabase
            .from("post")
            .select("id, name, image_url, updated_at, created_at, status")
            .ilike("status", "%adopted%")
            .order("updated_at", { ascending: false });
          postsData = res.data as any[] | null;
          postsError = res.error;
        } catch (e) {
          postsError = e;
        }
      }

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setRecords([]);
        return;
      }

      const postIds = postsData.map((p: any) => p.id);

      // Fetch adoption applications for these posts (get most recent applicant per post)
      // Fetch adoption records (applications/requests). Try plural then fallback to 'adoption_requests'
      let appsData: any[] | null = null;
      let appsError: any = null;
      try {
        const res = await supabase
          .from("adoption_applications")
          .select("post_id, applicant_id, created_at, status")
          .in("post_id", postIds as any)
          .order("created_at", { ascending: false });
        appsData = res.data as any[] | null;
        appsError = res.error;
      } catch (e) {
        appsError = e;
      }

      if ((appsError || !appsData) && (!appsData || appsData.length === 0)) {
        try {
          const res = await supabase
            .from("adoption_requests")
            .select("post_id, requester_id as applicant_id, created_at, status")
            .in("post_id", postIds as any)
            .order("created_at", { ascending: false });
          appsData = res.data as any[] | null;
          appsError = res.error;
        } catch (e) {
          appsError = e;
        }
      }

      if (appsError) throw appsError;

      // Build mapping postId -> most recent approved (or any) application
      const appMap = new Map<number, any>();
      (appsData || []).forEach((app: any) => {
        if (!appMap.has(app.post_id)) {
          appMap.set(app.post_id, app);
        }
      });

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
              acc[u.id] = u;
              return acc;
            }, {} as Record<string, any>);
          } else {
            // Fallback: call RPC `get_user_name` for each id (works even if `profiles` table isn't populated)
            // Note: this may be slower; but adoption volumes are small in admin view.
            await Promise.all(
              adopterIds.map(async (uid: string) => {
                try {
                  const { data: nameData, error: nameError } = await supabase.rpc("get_user_name", { user_id: uid });
                  if (!nameError && nameData) {
                    // rpc returns scalar text; shape it into an object for mapping
                    usersMap[uid] = { id: uid, full_name: Array.isArray(nameData) ? nameData[0] : nameData };
                  }
                } catch (err) {
                  console.warn("RPC get_user_name failed for", uid, err);
                }
              })
            );
          }
        } catch (e) {
          // If profiles or RPC are restricted by RLS, log and continue
          console.warn("Failed to fetch adopter user records:", e);
        }
      }

      const records: AdoptedRecord[] = postsData.map((p: any) => {
        const app = appMap.get(p.id);
        const adopterId = app?.applicant_id || null;
        const adopter = adopterId ? usersMap[adopterId] : null;
        return {
          post_id: p.id,
          post_name: p.name,
          image_url: p.image_url || null,
          adopted_at: app?.created_at || null,
          adopter_id: adopterId,
          adopter_name: adopter?.full_name || null,
        };
      });

      setRecords(records);
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Adoption Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adopter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adopted On</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No adopted pets found</td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.post_id}>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.post_name} className="w-14 h-14 object-cover rounded-md" />
                    ) : (
                      <div className="w-14 h-14 bg-violet-50 rounded-md" />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{r.post_name}</div>
                      <div className="text-sm text-gray-500">ID: {r.post_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {r.adopter_name || "Unknown"}
                    <div className="text-xs text-gray-400">{r.adopter_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {r.adopted_at ? new Date(r.adopted_at).toLocaleString() : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {/* Placeholder for possible future actions (view details, revert adoption) */}
                    <button className="text-blue-600 hover:underline">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
