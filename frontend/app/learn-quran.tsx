import { Redirect } from "expo-router";


export default function LegacyLearnQuranRoute() {
  return <Redirect href={"/quran/learn-ai" as any} />;
}
