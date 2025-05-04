import { useParams } from "react-router-dom";
import { CommunityDisplay } from "../components/CommunityDisplay";

export const CommunityPage = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-violet-50/50 via-blue-50/30 to-white px-4">
      <CommunityDisplay communityId={Number(id)} />
    </div>
  );
};
