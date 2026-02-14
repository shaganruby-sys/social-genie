import dynamic from "next/dynamic";

const SocialGenie = dynamic(() => import("./SocialGenie"), { ssr: false });

export default function Page() {
  return <SocialGenie />;
}
