// Owned render-error containment for the composer surfaces (ticket #131 hardening). A render failure inside the
// usage badge, Speed control or display setting (for example a host primitive that changed or vanished) removes only
// that surface instead of relying on the host slot boundary. Fresh code; not ported from the reference.
type ReactLike = { Component: any; createElement: (...args: any[]) => any };

export function guarded<P>(React: ReactLike, Component: (props: P) => any, label: string, report: (message: string, error: unknown) => void = (message, error) => console.error(message, error)): (props: P) => any {
  class Boundary extends React.Component {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(error: unknown) { report(`dsh-majed: ${label} failed to render`, error); }
    render() { return (this.state as { failed: boolean }).failed ? null : React.createElement(Component, (this as any).props); }
  }
  const wrapped = (props: P) => React.createElement(Boundary, props as any);
  Object.defineProperty(wrapped, 'name', { value: `Guarded${label.replace(/\W+/g, '')}` });
  return wrapped;
}
