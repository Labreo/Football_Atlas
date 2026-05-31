declare module 'franc-min' {
  function franc(
    text: string,
    options?: {
      minLength?: number;
      only?: string[];
      blacklist?: string[];
      whitelist?: string[];
    }
  ): string;
  export default franc;
}
