import RouteTransitionGate from '@/components/RouteTransitionGate';

export default function Template({ children }: { children: React.ReactNode }) {
  return <RouteTransitionGate>{children}</RouteTransitionGate>;
}
