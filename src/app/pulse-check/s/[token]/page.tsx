import { PulseCheckSurveyForm } from "@/components/pulse-check/PulseCheckSurveyForm";

export default async function PulseCheckSurveyPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  return <PulseCheckSurveyForm token={token} />;
}
