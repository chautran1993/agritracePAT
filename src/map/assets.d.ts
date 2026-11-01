declare module '*.css';
declare module '*?worker' {
  const WorkerConstructor: { new (): Worker };
  export default WorkerConstructor;
}
declare module '*?worker&url' {
  const url: string;
  export default url;
}
interface ImportMeta {
  readonly env: {
    readonly VITE_CARTO_API_KEY?: string;
    readonly DEV: boolean;
    readonly VITE_SHOW_DEMO_ACCOUNTS?: string;
  };
}
