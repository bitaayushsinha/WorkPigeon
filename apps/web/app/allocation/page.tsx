export const metadata = {
  title: "Allocation Engine | WorkPigeon",
  description: "Trigger workload rebalancing and view scoring breakdowns.",
};

import AllocationClient from "@/components/allocation/AllocationClient";

export default function AllocationPage() {
  return <AllocationClient />;
}
