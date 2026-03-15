import RoadmapDetailContainer from "@/src/app/(app)/roadmap/[roadmapId]/RoadmapDetailContainer";

type Props = {
  params: Promise<{ roadmapId: string }>;
};

export default async function Page({ params }: Props) {
  const { roadmapId } = await params;
  return <RoadmapDetailContainer roadmapId={Number(roadmapId)} />;
}
